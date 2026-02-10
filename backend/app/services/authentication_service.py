from __future__ import annotations

from typing import Optional

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.face_processor import FaceProcessor
from app.services.voice_processor import VoiceProcessor, VoiceFeatures


class AuthenticationService:
    """
    Minimal, stable service layer.

    Supports:
    - Face-only verification
    - Voice-only verification
    - Face + Voice fusion verification

    DB session is optional for future enrollment/template storage.
    """

    def __init__(self, session: Optional[AsyncSession] = None, debug: bool = False) -> None:
        self.session = session
        self.debug = debug

        self.face = FaceProcessor()
        self.voice = VoiceProcessor()

        # Thresholds (demo-friendly)
        # Face-only: daha düşük
        self.face_thr = 0.35
        # Voice-only: biraz daha yüksek
        self.voice_thr = 0.60
        # Fusion: ikisi birlikte gelince
        self.fusion_thr = 0.65

    async def verify(
        self,
        username: str,
        face_img: Optional[np.ndarray],
        audio: Optional[np.ndarray],
        sr: Optional[int],
    ) -> dict:
        # 1) skorları üret
        face_score = self._verify_face(face_img) if face_img is not None else 0.0
        voice_score = self._verify_voice(audio, sr) if (audio is not None and sr is not None) else 0.0

        # 2) karar mantığı (tek modality vs fusion)
        has_face = face_img is not None
        has_voice = audio is not None and sr is not None

        if has_face and not has_voice:
            # FACE only
            fusion_score = face_score
            decision = "GRANTED" if face_score >= self.face_thr else "DENIED"
            reason = f"face_only | face={face_score:.2f} thr={self.face_thr:.2f}"

        elif has_voice and not has_face:
            # VOICE only
            fusion_score = voice_score
            decision = "GRANTED" if voice_score >= self.voice_thr else "DENIED"
            reason = f"voice_only | voice={voice_score:.2f} thr={self.voice_thr:.2f}"

        elif has_face and has_voice:
            # FUSION
            fusion_score = (face_score + voice_score) / 2.0
            decision = "GRANTED" if fusion_score >= self.fusion_thr else "DENIED"
            reason = (
                f"fusion | face={face_score:.2f}, voice={voice_score:.2f}, "
                f"fusion={fusion_score:.2f} thr={self.fusion_thr:.2f}"
            )

        else:
            # hiçbir şey gelmediyse
            fusion_score = 0.0
            decision = "DENIED"
            reason = "no_input | face_missing | voice_missing"

        return {
            "decision": decision,
            "fusion_score": float(fusion_score),
            "face_score": float(face_score),
            "voice_score": float(voice_score),
            "reason": reason,
        }

    def _verify_face(self, face_img: np.ndarray) -> float:
        """
        Uses FaceProcessor features and returns a normalized score [0,1].
        """
        feats = self.face.extract_features(face_img)

        # Debug istersen aç
        if self.debug:
            print(
                "DEBUG FACE feats:",
                "L", feats.left_eye_open_norm,
                "R", feats.right_eye_open_norm,
                "nose", feats.nose_x_norm,
            )

        eye_avg = (feats.left_eye_open_norm + feats.right_eye_open_norm) / 2.0

        # nose_x 0.5'e yakınsa iyi
        center_score = 1.0 - abs(feats.nose_x_norm - 0.5) * 2.0
        center_score = max(0.0, min(1.0, center_score))

        score = 0.6 * eye_avg + 0.4 * center_score
        return float(max(0.0, min(1.0, score)))

    def _verify_voice(self, audio: np.ndarray, sr: int) -> float:
        """
        Uses VoiceProcessor feature extraction and returns a normalized score [0,1].
        Stable heuristic for demo.
        """
        feats: VoiceFeatures = self.voice.extract_features(audio, sr)

        # Debug istersen aç
        if self.debug:
            print("DEBUG VOICE feats:", "rms", feats.rms, "flat", feats.spec_flatness, "zcr", feats.zcr)

        # Basit stabil skor:
        rms_ok = 1.0 if feats.rms > 0.01 else 0.1
        flat_ok = 1.0 if 0.05 <= feats.spec_flatness <= 0.5 else 0.5
        zcr_ok = 1.0 if 0.02 <= feats.zcr <= 0.2 else 0.6

        score = 0.45 * rms_ok + 0.30 * flat_ok + 0.25 * zcr_ok
        return float(max(0.0, min(1.0, score)))
