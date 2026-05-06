from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import random

from app.db.models import SecurityQuestion, UserSecurityAnswer
from app.core.security import hash_security_answer, verify_security_answer

async def get_all_questions(db: AsyncSession):
    result = await db.execute(
        select(SecurityQuestion).where(SecurityQuestion.is_active == True)
    )
    questions = result.scalars().all()

    return [
        {
            "question_id": q.question_id,
            "question_text": q.question_text
        }
        for q in questions
    ]

async def save_user_answers(db: AsyncSession, user_id: int, answers: list):
    # Kullanıcının eski security answer kayıtlarını temizle
    await db.execute(
        delete(UserSecurityAnswer).where(UserSecurityAnswer.user_id == user_id)
    )

    # Yeni cevapları hashleyerek kaydet
    for item in answers:
        hashed = hash_security_answer(item.answer)

        record = UserSecurityAnswer(
            user_id=user_id,
            question_id=item.question_id,
            answer_hash=hashed,
        )

        db.add(record)

    await db.commit()

async def get_random_question(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(UserSecurityAnswer).where(UserSecurityAnswer.user_id == user_id)
    )
    answers = result.scalars().all()

    if not answers:
        return None

    chosen = random.choice(answers)

    question = await db.get(SecurityQuestion, chosen.question_id)

    return {
        "question_id": question.question_id,
        "question_text": question.question_text
    }

async def verify_answer(db: AsyncSession, user_id: int, question_id: int, input_answer: str):
    result = await db.execute(
        select(UserSecurityAnswer).where(
            UserSecurityAnswer.user_id == user_id,
            UserSecurityAnswer.question_id == question_id
        )
    )

    record = result.scalars().first()

    if not record:
        return False

    return verify_security_answer(input_answer, record.answer_hash)

