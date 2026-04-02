from dataclasses import dataclass
from typing import Optional
import io
import os

import librosa
import numpy as np
import soundfile as sf
import torch

from app.core.config import settings
from app.services.aasist_model import Model


@dataclass
class SpoofDetectionResult:
    spoof_score: Optional[float]
    spoof_decision: str
    model_loaded: bool
    error: Optional[str] = None


class VoiceSpoofDetector:
    def __init__(self) -> None:
        self.model = None
        self.model_loaded = False

        # config values
        self.enabled = settings.SPOOF_ENABLED
        self.mode = settings.SPOOF_MODE
        self.threshold = settings.SPOOF_THRESHOLD
        self.model_path = settings.SPOOF_MODEL_PATH
        self.device = settings.SPOOF_DEVICE

        self.min_audio_sec = settings.SPOOF_MIN_AUDIO_SEC
        self.max_audio_sec = settings.SPOOF_MAX_AUDIO_SEC

        self.fail_open = settings.SPOOF_FAIL_OPEN

    def _load_model(self) -> None:
        """
        AASIST checkpoint'ini yükler.
        """
        if not os.path.exists(self.model_path):
            raise RuntimeError(f"Spoof model not found at: {self.model_path}")

        d_args = {
            "filts": [70, [1, 32], [32, 32], [32, 64], [64, 64]],
            "gat_dims": [64, 32],
            "pool_ratios": [0.5, 0.7, 0.5, 0.5],
            "temperatures": [2.0, 2.0, 100.0, 100.0],
            "first_conv": 128,
        }

        model = Model(d_args)

        checkpoint = torch.load(self.model_path, map_location=self.device)

        if isinstance(checkpoint, dict):
            if "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            elif "model" in checkpoint:
                state_dict = checkpoint["model"]
            else:
                state_dict = checkpoint
        else:
            raise RuntimeError("Unsupported checkpoint format.")

        cleaned_state_dict = {}
        for key, value in state_dict.items():
            new_key = key.replace("module.", "", 1) if key.startswith("module.") else key
            cleaned_state_dict[new_key] = value

        model.load_state_dict(cleaned_state_dict, strict=True)
        model.to(self.device)
        model.eval()

        self.model = model
        self.model_loaded = True

    def _ensure_model_loaded(self) -> None:
        if not self.model_loaded:
            self._load_model()

    def _preprocess_audio(self, wav_bytes: bytes) -> tuple[torch.Tensor, float]:
        """
        WAV bytes -> model input tensor
        Returns:
            waveform tensor shape: [1, T]
            duration_sec: float
        """
        audio_np, sr = sf.read(io.BytesIO(wav_bytes), dtype="float32")

        if audio_np is None or len(audio_np) == 0:
            raise RuntimeError("Empty audio received.")

        # stereo ise mono yap
        if audio_np.ndim > 1:
            audio_np = np.mean(audio_np, axis=1)

        duration_sec = float(len(audio_np) / sr)

        # 16k'e çevir
        if sr != 16000:
            audio_np = librosa.resample(audio_np, orig_sr=sr, target_sr=16000)
            sr = 16000

        # peak normalize
        peak = float(np.max(np.abs(audio_np))) if len(audio_np) > 0 else 0.0
        if peak > 0.0:
            audio_np = audio_np / peak

        # sabit uzunluk: 4 saniye
        target_len = 16000 * 4
        if len(audio_np) > target_len:
            audio_np = audio_np[:target_len]
        else:
            pad_len = target_len - len(audio_np)
            audio_np = np.pad(audio_np, (0, pad_len))

        waveform = torch.from_numpy(audio_np).float()

        if waveform.ndim == 1:
            waveform = waveform.unsqueeze(0)  # [1, T]

        return waveform, duration_sec

    def detect_spoof(self, wav_bytes: bytes) -> SpoofDetectionResult:
        try:
            if not self.enabled:
                return SpoofDetectionResult(
                    spoof_score=None,
                    spoof_decision="disabled",
                    model_loaded=self.model_loaded,
                    error=None,
                )

            self._ensure_model_loaded()

            waveform, audio_length_sec = self._preprocess_audio(wav_bytes)

            if audio_length_sec < self.min_audio_sec:
                return SpoofDetectionResult(
                    spoof_score=None,
                    spoof_decision="too_short",
                    model_loaded=self.model_loaded,
                    error="audio_too_short",
                )

            if audio_length_sec > self.max_audio_sec:
                return SpoofDetectionResult(
                    spoof_score=None,
                    spoof_decision="too_long",
                    model_loaded=self.model_loaded,
                    error="audio_too_long",
                )

            input_tensor = waveform.to(self.device)

            with torch.no_grad():
                _, output = self.model(input_tensor)
                probs = torch.softmax(output, dim=1)

                # class 0 = genuine / bona fide
                # class 1 = spoof
                spoof_score = float(probs[0, 1].item())

                # Test için açmak istersen:
                # print("AASIST PROBS:", probs.cpu().numpy())

            decision = "spoof" if spoof_score >= self.threshold else "genuine"

            return SpoofDetectionResult(
                spoof_score=spoof_score,
                spoof_decision=decision,
                model_loaded=self.model_loaded,
                error=None,
            )

        except Exception as e:
            return SpoofDetectionResult(
                spoof_score=None,
                spoof_decision="error",
                model_loaded=self.model_loaded,
                error=str(e),
            )