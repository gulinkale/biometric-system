let selectedCompany = null;
let selectedMethod = null;

// camera
let stream = null;

// voice (TEK kaynak)
let mediaRecorder = null;
let mediaStream = null;
let audioChunks = [];
let recordedAudioBase64 = null; // <-- TEK değişken (base64)
let isRecording = false;

/* =========================
   STEP NAVIGATION
========================= */
function selectCompany(company) {
  selectedCompany = company;
  document.getElementById("step-company")?.classList.add("hidden");
  document.getElementById("step-method")?.classList.remove("hidden");
}

async function selectMethod(method) {
  selectedMethod = method;

  document.getElementById("step-method")?.classList.add("hidden");

  if (method === "face") {
    document.getElementById("step-face")?.classList.remove("hidden");
    await startCamera();
  }

  if (method === "voice") {
    document.getElementById("step-voice")?.classList.remove("hidden");
  }
}

/* =========================
   CAMERA
========================= */
async function startCamera() {
  const video = document.getElementById("video");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Camera error:", err);
    alert("Camera access denied or not available");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}

/* =========================
   FACE CAPTURE & SEND
========================= */
async function captureFace() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

  // Backend'i şaşırtmamak için iki alanı da gönderiyoruz (biri null)
  const payload = {
    username: "demo_user",
    face_image_b64: imageBase64,
    voice_wav_b64: null,
  };

  await sendVerify(payload);
}

/* =========================
   VOICE RECORDING (TEK AKIŞ)
========================= */
async function startVoiceRecording() {
  if (isRecording) return;

  recordedAudioBase64 = null;
  audioChunks = [];

  try {
    setVoiceStatus("Requesting microphone permission...");

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(mediaStream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      try {
        // mic kapat
        if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
      } catch (_) {}

      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });

      // blob -> SADECE base64 string (prefix yok)
      recordedAudioBase64 = await blobToBase64(blob);

      // opsiyonel preview
      const audioEl = document.getElementById("audio-preview");
      if (audioEl) {
        audioEl.src = URL.createObjectURL(blob);
        audioEl.classList.remove("hidden");
      }

      setVoiceStatus("Voice recorded ✅ Ready to verify.");
      setVoiceButtons({ recording: false, canSend: true });

      isRecording = false;
    };

    mediaRecorder.start();
    isRecording = true;

    setVoiceStatus("Recording... 🎙️");
    setVoiceButtons({ recording: true, canSend: false });
  } catch (err) {
    console.error("Mic error:", err);
    alert("Microphone access denied or not available.");
    setVoiceStatus("");
    setVoiceButtons({ recording: false, canSend: false });
    isRecording = false;
  }
}

function stopVoiceRecording() {
  if (!mediaRecorder) return;

  if (mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  } else {
    // zaten durmuşsa mic kapat
    if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
  }
}

async function sendVoice() {
  if (!recordedAudioBase64) {
    alert("Please record your voice first.");
    return;
  }

  console.log("VOICE b64 length:", recordedAudioBase64.length);

  const payload = {
    username: "demo_user",
    face_image_b64: null,
    voice_wav_b64: recordedAudioBase64, // <-- SADECE base64
  };

  await sendVerify(payload);
}

/* =========================
   COMMON: SEND VERIFY
========================= */
async function sendVerify(payload) {
  try {
    const res = await fetch("http://127.0.0.1:8000/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);

    if (!res.ok) {
      alert("Backend error: " + res.status + "\n" + text);
      return;
    }

    const data = JSON.parse(text);
    showResult(data);
  } catch (err) {
    console.error(err);
    alert("Backend connection failed");
  }
}

/* =========================
   UI: RESULT
========================= */
function showResult(data) {
  stopCamera();

  // kayıt devam ediyorsa durdur
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    try {
      mediaRecorder.stop();
    } catch (_) {}
  }
  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach((t) => t.stop());
    } catch (_) {}
  }

  // tüm step'leri gizle
  document.getElementById("step-company")?.classList.add("hidden");
  document.getElementById("step-method")?.classList.add("hidden");
  document.getElementById("step-face")?.classList.add("hidden");
  document.getElementById("step-voice")?.classList.add("hidden");

  // result göster
  document.getElementById("step-result")?.classList.remove("hidden");

  document.getElementById("result-decision").innerText =
    "Decision: " + (data.decision ?? "N/A");

  document.getElementById("face-score").innerText =
    Number(data.face_score ?? 0).toFixed(2);

  document.getElementById("voice-score").innerText =
    Number(data.voice_score ?? 0).toFixed(2);

  document.getElementById("fusion-score").innerText =
    Number(data.fusion_score ?? 0).toFixed(2);
}

function restart() {
  stopCamera();
  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach((t) => t.stop());
    } catch (_) {}
  }
  location.reload();
}

/* =========================
   HELPERS
========================= */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      // reader.result = "data:audio/webm;base64,AAAA...."
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(",")[1]; // sadece AAAA... kısmı
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function setVoiceStatus(text) {
  const el = document.getElementById("voice-status");
  if (el) el.innerText = text;
}

// Hem eski id'ler (btn-record/btn-stop) hem yeni id'ler (btn-voice-*) varsa yönet
function setVoiceButtons({ recording, canSend }) {
  // Set A: btn-record / btn-stop (senin UI’da var gibi)
  const btnRecord = document.getElementById("btn-record");
  const btnStop = document.getElementById("btn-stop");
  if (btnRecord && btnStop) {
    if (recording) {
      btnRecord.classList.add("hidden");
      btnStop.classList.remove("hidden");
    } else {
      btnStop.classList.add("hidden");
      btnRecord.classList.remove("hidden");
    }
  }

  // Set B: btn-voice-start / btn-voice-stop / btn-voice-send (diğer tasarım)
  const s = document.getElementById("btn-voice-start");
  const t = document.getElementById("btn-voice-stop");
  const v = document.getElementById("btn-voice-send");

  if (s) s.disabled = recording;
  if (t) t.disabled = !recording;
  if (v) v.disabled = !canSend;
}
