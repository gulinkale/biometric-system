import { API_BASE } from "./config.js";

// küçük helper: URL birleştir (çift slash olmasın)
function joinUrl(base, path) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function jsonFetch(path, options = {}) {
  const url = joinUrl(API_BASE, path);

  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    throw new Error("NETWORK_ERROR");
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.detail || data?.message || `HTTP_${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// -------------------------
// ENROLL (FACE - session based)
// -------------------------
export function apiStartEnroll(username, role) {
  return jsonFetch("/enroll/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, role }),
  });
}

export function apiPushFrame(session_id, face_image_b64) {
  return jsonFetch("/enroll/frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, face_image_b64 }),
  });
}

export function apiFinishEnroll(session_id) {
  return jsonFetch("/enroll/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id }),
  });
}

// -------------------------
// ENROLL (VOICE - identity template)
// -------------------------
export function apiGetVoiceChallenge(username, excludeIds = []) {
  const query = excludeIds.length
    ? `${excludeIds.map((id) => `exclude_ids=${encodeURIComponent(id)}`).join("&")}`
    : "";
  const usernameQuery = `username=${encodeURIComponent(username || "")}`;
  const finalQuery = query ? `?${usernameQuery}&${query}` : `?${usernameQuery}`;

  return jsonFetch(`/enroll/voice/challenge${finalQuery}`, {
    method: "GET",
  });
}

export function apiEnrollVoice(
  username,
  role,
  voice_wav_b64,
  challenge_id,
  challenge_answer_text
) {
  return jsonFetch("/enroll/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      role,
      voice_wav_b64,
      challenge_id,
      challenge_answer_text,
    }),
  });
}

export function apiEnrollVoiceBatch(username, role, samples) {
  return jsonFetch("/enroll/voice/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, role, samples }),
  });
}

// -------------------------
// IDENTIFY (1:N) - Face
// -------------------------
export function apiIdentifyFace(face_image_b64) {
  // 307 redirect yememek için /identify/ daha stabil
  return jsonFetch("/identify/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ face_image_b64 }),
  });
}

export function apiIdentifyVoiceChallenge() {
  return jsonFetch("/identify/voice-challenge", {
    method: "GET",
  });
}

export function apiValidateIdentifyVoiceChallenge(challenge_id, answer_text) {
  return jsonFetch("/identify/voice-challenge/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id, answer_text }),
  });
}

export function apiIdentifyPoseCheck(
  face_image_b64,
  required_turn,
  reference_face_image_b64 = null,
  expected_user_id = null
) {
  return jsonFetch("/identify/pose-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      face_image_b64,
      required_turn,
      reference_face_image_b64,
      expected_user_id,
      require_eyes_open: true,
    }),
  });
}

export function apiIdentifyBlinkCheck(
  face_frames_b64,
  reference_face_image_b64 = null,
  expected_user_id = null
) {
  return jsonFetch("/identify/blink-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      face_frames_b64,
      reference_face_image_b64,
      expected_user_id,
    }),
  });
}

// -------------------------
// AUTH VERIFY (Face + Voice)  (username YOK)
// -------------------------
export function apiAuthVerify({ face_image_b64, voice_wav_b64 }) {
  return jsonFetch("/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ face_image_b64, voice_wav_b64 }),
  });
}