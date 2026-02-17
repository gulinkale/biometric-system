from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.session import get_session
from app.services.authentication_service import AuthenticationService
from app.utils.image_io import b64_to_bgr_image

router = APIRouter(prefix="/enroll", tags=["enroll"])

_auth_service = AuthenticationService()


class EnrollRequest(BaseModel):
    username: str
    role: str
    face_image_b64: str


@router.post("/")
async def enroll(req: EnrollRequest, session: AsyncSession = Depends(get_session)):
    try:
        img = b64_to_bgr_image(req.face_image_b64)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"INVALID_IMAGE: {e}")

    result = await _auth_service.enroll_user(
        session=session,
        username=req.username,
        role=req.role,
        face_img=img,
    )
    return result
