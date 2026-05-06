
### Faz 1 — Mevcut backend yapısını inceleme

Kod yazmadan sadece bakacağız:

* modeller nerede?
* schema dosyası nerede?
* route dosyaları nasıl bağlanıyor?
* DB session nasıl kullanılıyor?
* password hashing için mevcut utility var mı?

Çıktı: hangi dosyalara dokunacağımız netleşecek.

---

### Faz 2 — Database model ekleme

Yeni tablolar:

```text
SecurityQuestion
- id
- question_text
- is_active

UserSecurityAnswer
- id
- user_id
- question_id
- answer_hash
- created_at
```

Bu aşamada sadece model yazacağız. Endpoint yok.

Test:
Backend açılıyor mu?
Tablolar oluşuyor mu?

---

### Faz 3 — Normalize + hash helper

Cevaplar plaintext saklanmayacak.

Eklenecek mantık:

```text
normalize_answer(" İstanbul ") → "istanbul"
hash_answer(normalized_answer)
verify_answer(input, stored_hash)
```

Bu aşamada route yok.

---

### Faz 4 — Pydantic schemas

Request/response modelleri:

```text
SecurityQuestionResponse
SaveSecurityAnswersRequest
SaveSecurityAnswersResponse
SecurityChallengeResponse
VerifySecurityAnswerRequest
VerifySecurityAnswerResponse
```

Sadece schema eklenecek.

---

### Faz 5 — Service layer

Asıl business logic burada olacak:

```text
get_active_questions()
save_user_security_answers(user_id, answers)
get_random_user_question(user_id)
verify_user_answer(user_id, question_id, transcript)
```

Bu aşamada route yok veya minimum route yok.

---

### Faz 6 — API route ekleme

Backend endpointleri:

```text
GET  /enroll/security-questions
POST /enroll/security-answers

GET  /identify/security-question
POST /identify/security-answer
```

Bu aşamada Swagger’dan test edeceğiz.

---

### Faz 7 — Seed questions

20 hazır soru sisteme eklenecek.

İlk başta manuel/otomatik seed:

```text
What is your favorite city?
What was the name of your first school?
...
```

Bu aşamada sorular backend’den geliyor mu test edilir.

---

### Faz 8 — Enrollment frontend

Enrollment ekranına yeni step:

```text
Select 3 security questions
Enter answers
Save with enrollment
```

Önce sadece UI, sonra API bağlantısı.

---

### Faz 9 — Identify frontend

Identify ekranına yeni step:

```text
Face identify
→ backend random question döner
→ user sesli cevap verir
→ transcript gönderilir
→ answer_ok alınır
```

---

### Faz 10 — Final decision entegrasyonu

Bu en son yapılacak.

Kural:

```text
answer_ok false ise DENIED
```

Yani soru cevabı bypass edilemeyecek.

---

## Bizim çalışma şeklimiz

Her fazda:

```text
1. Hangi dosya?
2. Neyi ekliyoruz?
3. Kodu yazıyoruz
4. Çalıştırıyoruz
5. Hata varsa düzeltiyoruz
6. Commit
```

İlk adım: **Faz 1 — mevcut backend yapısını inceleme.**
