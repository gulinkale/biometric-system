from __future__ import annotations

from typing import Optional
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, BiometricData
from app.services.face_processor import FaceProcessor
from app.services.voice_processor import VoiceProcessor, VoiceFeatures


class AuthenticationService:

    def __init__(self) -> None:
        self.face = FaceProcessor()
        self.voice = VoiceProcessor()

        # thresholds
        self.fusion_thr = 0.75
        self.identification_thr = 0.90  # 1:N match threshold

    # =====================================================
    # ================= ENROLLMENT ========================
    # =====================================================

    @staticmethod
    def _cosine(a: np.ndarray, b: np.ndarray) -> float:
        a = a.astype(np.float32)
        b = b.astype(np.float32)
        return float(np.dot(a, b) / ((np.linalg.norm(a) + 1e-8) * (np.linalg.norm(b) + 1e-8)))

    async def enroll_user(
        self,
        session: AsyncSession,
        username: str,
        role: str,
        face_img: np.ndarray,
    ) -> dict:

        # user var mı?
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if user is None:
            user = User(username=username, role=role)
            session.add(user)
            await session.flush()

        feats = self.face.extract_features(face_img)

        vec = np.array(
            [feats.nose_x_norm, feats.left_eye_open_norm, feats.right_eye_open_norm],
            dtype=np.float32,
        )
        blob = vec.tobytes()

        # mevcut face var mı?
        result2 = await session.execute(
            select(BiometricData).where(
                BiometricData.user_id == user.user_id,
                BiometricData.type == "face_feature",
            )
        )
        existing = result2.scalar_one_or_none()

        if existing:
            old_vec = np.frombuffer(existing.enc_feature_blob, dtype=np.float32)
            sim = self._cosine(vec, old_vec)

            if sim >= 0.95:
                await session.commit()
                return {
                    "status": "FACE_ALREADY_REGISTERED",
                    "similarity": sim,
                }

            existing.enc_feature_blob = blob
            await session.commit()
            return {
                "status": "FACE_UPDATED",
                "similarity": sim,
            }

        session.add(
            BiometricData(
                type="face_feature",
                enc_feature_blob=blob,
                user_id=user.user_id,
            )
        )

        await session.commit()

        return {
            "status": "ENROLLED",
            "user_id": user.user_id,
        }

    # =====================================================
    # ================= IDENTIFICATION (1:N) ===============
    # =====================================================

    async def identify_face(
        self,
        session: AsyncSession,
        face_img: np.ndarray,
    ) -> dict:

        feats = self.face.extract_features(face_img)

        query_vec = np.array(
            [feats.nose_x_norm, feats.left_eye_open_norm, feats.right_eye_open_norm],
            dtype=np.float32,
        )

        result = await session.execute(
            select(User, BiometricData)
            .join(BiometricData)
            .where(BiometricData.type == "face_feature")
        )

        best_score = 0.0
        best_user = None

        for user, bio in result.all():
            db_vec = np.frombuffer(bio.enc_feature_blob, dtype=np.float32)
            sim = self._cosine(query_vec, db_vec)

            if sim > best_score:
                best_score = sim
                best_user = user

        if best_user and best_score >= self.identification_thr:
            return {
                "identified": True,
                "user_id": best_user.user_id,
                "username": best_user.username,
                "similarity": best_score,
            }

        return {
            "identified": False,
            "similarity": best_score,
        }

    # =====================================================
    # ================= VERIFY (FUSION) ===================
    # =====================================================

    async def verify(
        self,
        session: AsyncSession,
        face_img: Optional[np.ndarray],
        audio: Optional[np.ndarray],
        sr: Optional[int],
    ) -> dict:

        identified_user = None
        face_score = 0.0

        if face_img is not None:
            id_result = await self.identify_face(session, face_img)

            if id_result["identified"]:
                identified_user = id_result["username"]
                face_score = float(id_result["similarity"])
            else:
                face_score = float(id_result["similarity"])

        voice_score = 0.0
        if audio is not None and sr is not None:
            voice_score = self._verify_voice(audio, sr)

        used = 0
        total = 0.0

        if face_img is not None:
            total += face_score
            used += 1

        if audio is not None and sr is not None:
            total += voice_score
            used += 1

        fusion_score = total / used if used > 0 else 0.0

        decision = "GRANTED" if fusion_score >= self.fusion_thr else "DENIED"

        return {
            "decision": decision,
            "identified_user": identified_user,
            "fusion_score": float(fusion_score),
            "face_score": float(face_score),
            "voice_score": float(voice_score),
        }

    # =====================================================
    # ================= VOICE SCORING =====================
    # =====================================================

    def _verify_voice(self, audio: np.ndarray, sr: int) -> float:

        feats: VoiceFeatures = self.voice.extract_features(audio, sr)

        rms_ok = 1.0 if feats.rms > 0.01 else 0.1
        flat_ok = 1.0 if 0.05 <= feats.spec_flatness <= 0.5 else 0.5
        zcr_ok = 1.0 if 0.02 <= feats.zcr <= 0.2 else 0.6

        score = 0.45 * rms_ok + 0.30 * flat_ok + 0.25 * zcr_ok

        return float(max(0.0, min(1.0, score)))
