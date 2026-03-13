from __future__ import annotations

from dataclasses import dataclass
from typing import Final

import librosa
import numpy as np

# Resemblyzer encoder lazy-load
_encoder = None


def _get_encoder():
    global _encoder
    if _encoder is None:
        from resemblyzer import VoiceEncoder
        _encoder = VoiceEncoder()
    return _encoder


@dataclass(frozen=True)
class VoiceFeatures:
    rms: float
    zcr: float
    spec_flatness: float
    mfcc_mean: float


class VoiceProcessor:
    DEFAULT_N_MFCC: Final[int] = 13
    TARGET_SR: Final[int] = 16000
    EPS: Final[float] = 1e-12
    TARGET_RMS: Final[float] = 0.08

    def __init__(self, n_mfcc: int = DEFAULT_N_MFCC) -> None:
        self._n_mfcc = int(n_mfcc)

    # -------------------------
    # Shared preprocessing
    # -------------------------
    def _validate_and_preprocess(
        self,
        audio: np.ndarray,
        sr: int,
        min_seconds: float,
    ) -> tuple[np.ndarray, int]:
        if audio is None or not isinstance(audio, np.ndarray) or audio.size == 0:
            raise ValueError("INVALID_AUDIO")

        if audio.ndim != 1:
            raise ValueError("AUDIO_NOT_MONO")

        sr = int(sr)
        if sr <= 0:
            raise ValueError("INVALID_SAMPLE_RATE")

        if not np.isfinite(audio).all():
            raise ValueError("AUDIO_NOT_FINITE")

        audio = audio.astype(np.float32, copy=False)

        # Resample to stable sample rate
        if sr != self.TARGET_SR:
            audio = librosa.resample(y=audio, orig_sr=sr, target_sr=self.TARGET_SR)
            sr = self.TARGET_SR

        min_samples = int(min_seconds * sr)
        if audio.size < min_samples:
            raise ValueError("AUDIO_TOO_SHORT")

        # Peak normalize
        peak = float(np.max(np.abs(audio)))
        if peak > self.EPS:
            audio = audio / peak

        return audio, sr

    # -------------------------
    # Liveness-ish heuristic features
    # -------------------------
    def extract_features(self, audio: np.ndarray, sr: int) -> VoiceFeatures:
        audio, sr = self._validate_and_preprocess(audio, sr, min_seconds=0.2)

        rms = float(np.mean(librosa.feature.rms(y=audio)))
        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=audio)))
        flat = float(np.mean(librosa.feature.spectral_flatness(y=audio)))

        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=self._n_mfcc)
        mfcc_mean = float(np.mean(mfcc))

        return VoiceFeatures(
            rms=rms,
            zcr=zcr,
            spec_flatness=flat,
            mfcc_mean=mfcc_mean,
        )

    # -------------------------
    # Identity embedding (Resemblyzer GE2E d-vector)
    # -------------------------
    def extract_embedding(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Returns a 256-d speaker embedding using Resemblyzer.
        """
        audio, sr = self._validate_and_preprocess(audio, sr, min_seconds=1.0)
        raw_audio = np.array(audio, copy=True)

        # Stabilize browser recordings: trim silence first, but fall back to
        # the raw signal when trim is too aggressive for short utterances.
        trimmed, _ = librosa.effects.trim(raw_audio, top_db=28)
        min_samples_for_embed = int(0.8 * sr)
        work_audio = trimmed if trimmed.size >= min_samples_for_embed else raw_audio

        if work_audio.size < min_samples_for_embed:
            raise ValueError("AUDIO_TOO_SHORT")

        work_audio = work_audio - float(np.mean(work_audio))
        rms = float(np.sqrt(np.mean(np.square(work_audio))) + self.EPS)
        if rms < 1e-5:
            raise ValueError("AUDIO_TOO_QUIET")
        gain = self.TARGET_RMS / rms
        work_audio = np.clip(work_audio * gain, -1.0, 1.0)

        from resemblyzer import preprocess_wav

        encoder = _get_encoder()

        # preprocess_wav handles normalization/cleanup expected by resemblyzer
        try:
            wav = preprocess_wav(work_audio, source_sr=sr)
            emb = encoder.embed_utterance(wav)
        except Exception:
            # Final fallback path: try once with raw audio to avoid false
            # failures caused by pathological trim/normalization cases.
            wav = preprocess_wav(raw_audio, source_sr=sr)
            emb = encoder.embed_utterance(wav)

        emb = np.asarray(emb, dtype=np.float32)
        if emb.size == 0 or not np.isfinite(emb).all():
            raise ValueError("VOICE_EMBEDDING_INVALID")

        return emb