from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import SecurityQuestion

# 20 hazır soru
DEFAULT_QUESTIONS = [
    "İlkokul öğretmeninizin adı nedir?",
    "En sevdiğiniz renk nedir?",
    "Doğduğunuz şehir nedir?",
    "En sevdiğiniz yemek nedir?",
    "İlk evcil hayvanınızın adı nedir?",
    "Çocukluk lakabınız nedir?",
    "Annenizin kızlık soyadı nedir?",
    "En sevdiğiniz film nedir?",
    "En sevdiğiniz tatil yeri neresidir?",
    "En yakın arkadaşınızın adı nedir?",
    "En sevdiğiniz spor nedir?",
    "İlk çalıştığınız iş nedir?",
    "En sevdiğiniz kitap nedir?",
    "Hayalinizdeki meslek nedir?",
    "En sevdiğiniz müzik türü nedir?",
    "İlk okulunuzun adı nedir?",
    "En sevdiğiniz tatlı nedir?",
    "Favori futbol takımınız nedir?",
    "En sevdiğiniz mevsim hangisidir?",
    "İlk arabınızın markası nedir?"
]


async def seed_security_questions(db: AsyncSession):
    # Zaten varsa tekrar ekleme
    result = await db.execute(select(SecurityQuestion))
    existing = result.scalars().first()

    if existing:
        print("Security questions already exist, skipping seed.")
        return

    print("Seeding security questions...")

    for q in DEFAULT_QUESTIONS:
        db.add(SecurityQuestion(question_text=q))

    await db.commit()

    print("Security questions seeded successfully.")