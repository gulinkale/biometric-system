# 🔐 Biometric Authentication System

A modular, software-only biometric authentication platform built with FastAPI and a lightweight frontend.

This project demonstrates real-time face-based identification (FaceID-style login) and biometric enrollment using a camera — without any external hardware devices.

---

## 🚀 Features

- 🎥 Face Enrollment (store user facial templates)
- 🧠 1:N Face Identification (FaceID-like login)
- 📷 Real-time camera capture (WebRTC)
- 🔄 Automatic sample collection during enrollment
- 🎙️ Optional voice capture (experimental)
- ⚡ FastAPI backend for processing
- 🌐 Clean modular frontend

---

## 🧱 Project Structure
Biometric_System/
│
├── backend/ # FastAPI application
│ ├── app/
│ ├── models/
│ ├── services/
│ └── main.py
│
├── frontend/
│ ├── portal/ # Portal entry point
│ ├── biometric/
│ │ ├── identify.html # FaceID-style login (1:N)
│ │ ├── enroll.html # Biometric enrollment (admin)
│ │
│ └── assets/
│ ├── css/
│ └── js/
│
└── README.md


---

## 🧠 System Architecture

- Face images are captured via browser
- Frames are converted to base64
- Sent to FastAPI backend
- Backend extracts embeddings
- Stored embeddings used for identification

**Login Flow (1:N Identification)**

1. User opens biometric login
2. Camera captures face
3. Backend compares against stored templates
4. Returns identified user (if similarity threshold passed)

---

## 🛠 Tech Stack

| Layer      | Technology |
|------------|------------|
| Backend    | FastAPI (Python) |
| Frontend   | HTML, CSS, Vanilla JS |
| Camera     | WebRTC (getUserMedia) |
| ML Model   | Face embedding model |
| API Format | REST (JSON + Base64 images) |

---

⚙️ How to Run

1️⃣ Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000

2️⃣ Frontend
cd frontend
python3 -m http.server 5500

3️⃣ Open in browser
http://localhost:5500/portal/login_portal.html