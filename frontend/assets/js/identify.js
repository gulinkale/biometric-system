import { byId, setText } from "./dom.js";
import { startCamera, stopCamera, captureFrameBase64 } from "./camera.js";
import {
  apiIdentifyFace,
  apiAuthVerify,
  apiIdentifyVoiceChallenge,
  apiValidateIdentifyVoiceChallenge,
  apiIdentifyPoseCheck,
} from "./api.js";
import {
  recognizeSpeechOnce,
  startVoiceRecording,
  stopVoiceRecordingToBase64,
} from "./voice.js";

/**
 * Identify page flow:
 * Face capture -> /identify (1:N) -> user found
 * Voice record -> /auth/verify (face + voice)
 */
export function initIdentify() {
  // --- step helper ---
  const stepIds = ["step-face", "step-liveness", "step-result"];
  function showStep(idToShow) {
    stepIds.forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.classList.toggle("hidden", id !== idToShow);
    });
  }

  // --- elements ---
  const videoEl = byId("video");
  const canvasEl = byId("canvas");

  const faceStatusEl = byId("faceStatus");
  const statusTextEl = byId("statusText");

  const btnCamStart = byId("btnCamStart");
  const btnFaceCapture = byId("btnFaceCapture");
  const btnBack = byId("btnBack");

  const identifyChallengePromptEl = byId("identifyChallengePrompt");
  const identifyChallengeAnswerEl = byId("identifyChallengeAnswer");
  const livenessStatusEl = byId("livenessStatus");
  const btnCaptureChallengeAnswer = byId("btnCaptureChallengeAnswer");
  const btnRefreshIdentifyChallenge = byId("btnRefreshIdentifyChallenge");
  const btnCheckTurnRight = byId("btnCheckTurnRight");
  const btnCheckTurnLeft = byId("btnCheckTurnLeft");
  const btnLivenessContinue = byId("btnLivenessContinue");

  const btnRestartResult = byId("btnRestartResult");

  const decisionEl = byId("result-decision");
  const faceScoreEl = byId("face-score");
  const voiceScoreEl = byId("voice-score");
  const fusionScoreEl = byId("fusion-score");

  const identifiedUserBanner = byId("identifiedUserBanner");
  const identifiedUserName = byId("identifiedUserName");
  const flowDebugStepEl = byId("flowDebugStep");
  const flowDebugStatusEl = byId("flowDebugStatus");
  const flowDebugReasonEl = byId("flowDebugReason");
  const flowDebugScoreEl = byId("flowDebugScore");

  // --- state ---
  let faceB64 = null;
  let faceScore = 0;
  let identifiedUser = null; // sadece bilgi amaçlı
  let identifyChallengeId = null;
  let challengeVoiceB64 = null;
  let livenessOrder = [];
  let livenessStepIndex = 0;

  // --- status helpers ---
  function setFaceStatus(msg) {
    if (faceStatusEl) setText(faceStatusEl, msg);
    console.log("[FACE]", msg);
  }

  function setStatus(msg) {
    if (statusTextEl) setText(statusTextEl, msg);
    console.log("[STATUS]", msg);
  }

  function setLivenessStatus(msg) {
    if (livenessStatusEl) setText(livenessStatusEl, msg);
    console.log("[LIVENESS]", msg);
  }

  function flowStepName(task) {
    if (task === "answer") return "voice_answer";
    if (task === "turn_right") return "turn_right";
    if (task === "turn_left") return "turn_left";
    return "done";
  }

  function setFlowDebug(step, status, reason = "-", score = "-") {
    if (flowDebugStepEl) setText(flowDebugStepEl, step || "-");
    if (flowDebugStatusEl) setText(flowDebugStatusEl, status || "-");
    if (flowDebugReasonEl) setText(flowDebugReasonEl, reason || "-");
    if (flowDebugScoreEl) setText(flowDebugScoreEl, score || "-");
    console.log(
      `[FLOW] step=${step || "-"} status=${status || "-"} reason=${reason || "-"} score=${score || "-"}`
    );
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function taskLabel(task) {
    if (task === "answer") return "Challenge sorusuna cevap ver";
    if (task === "turn_right") return "Basini SAGA cevir ve kontrol et";
    if (task === "turn_left") return "Basini SOLA cevir ve kontrol et";
    return "-";
  }

  function currentTask() {
    return livenessOrder[livenessStepIndex] || null;
  }

  function initSequentialLivenessOrder() {
    livenessOrder = ["answer", "turn_right", "turn_left"];
    livenessStepIndex = 0;
    updateLivenessUI();
  }

  function stepDone(task) {
    if (currentTask() !== task) {
      setLivenessStatus(`Sira hatasi. Simdi yapman gereken: ${taskLabel(currentTask())}`);
      setFlowDebug(flowStepName(currentTask()), "failed", "STEP_ORDER_MISMATCH");
      return false;
    }
    setFlowDebug(flowStepName(task), "passed", "OK");
    livenessStepIndex += 1;
    updateLivenessUI();
    return true;
  }

  function updateLivenessUI() {
    const task = currentTask();
    const finished = !task;

    if (btnCaptureChallengeAnswer) btnCaptureChallengeAnswer.disabled = task !== "answer";
    if (btnCheckTurnRight) btnCheckTurnRight.disabled = task !== "turn_right";
    if (btnCheckTurnLeft) btnCheckTurnLeft.disabled = task !== "turn_left";
    if (btnLivenessContinue) btnLivenessContinue.disabled = !finished;
    if (btnRefreshIdentifyChallenge) btnRefreshIdentifyChallenge.disabled = task !== "answer";
    if (identifyChallengeAnswerEl) identifyChallengeAnswerEl.disabled = task !== "answer";

    // Show only the control related to current step for a strict guided flow.
    if (btnCaptureChallengeAnswer) {
      btnCaptureChallengeAnswer.style.display = task === "answer" ? "" : "none";
    }
    if (btnRefreshIdentifyChallenge) {
      btnRefreshIdentifyChallenge.style.display = task === "answer" ? "" : "none";
    }
    if (identifyChallengeAnswerEl) {
      identifyChallengeAnswerEl.style.display = task === "answer" ? "" : "none";
    }
    if (identifyChallengePromptEl) {
      identifyChallengePromptEl.style.display = task === "answer" ? "" : "none";
    }
    if (btnCheckTurnRight) {
      btnCheckTurnRight.style.display = task === "turn_right" ? "" : "none";
    }
    if (btnCheckTurnLeft) {
      btnCheckTurnLeft.style.display = task === "turn_left" ? "" : "none";
    }
    if (btnLivenessContinue) {
      btnLivenessContinue.style.display = finished ? "" : "none";
    }

    if (finished) {
      setLivenessStatus("Tum sira kontrollleri tamamlandi. Continue to Voice.");
      setFlowDebug("done", "waiting", "READY_FOR_VERIFY");
      return;
    }

    setFlowDebug(flowStepName(task), "waiting", "USER_ACTION_REQUIRED");

    setLivenessStatus(
      `Adim ${livenessStepIndex + 1}/3: ${taskLabel(task)}`
    );
  }

  async function loadIdentifyChallenge() {
    try {
      const ch = await apiIdentifyVoiceChallenge();
      identifyChallengeId = ch?.challenge_id || null;
      setText(
        identifyChallengePromptEl,
        ch?.prompt || "Please answer the displayed question."
      );
      if (identifyChallengeAnswerEl) identifyChallengeAnswerEl.value = "";
      challengeVoiceB64 = null;
      initSequentialLivenessOrder();
    } catch (e) {
      console.error(e);
      identifyChallengeId = null;
      setText(identifyChallengePromptEl, "Challenge unavailable.");
      setLivenessStatus("Challenge load failed.");
    }
  }

  // --- initial UI ---
  showStep("step-face");
  if (btnLivenessContinue) btnLivenessContinue.style.display = "none";
  setFlowDebug("face_front", "waiting", "START_CAMERA_AND_CAPTURE");

  // -----------------------
  // 1) Camera
  // -----------------------
  btnCamStart?.addEventListener("click", async () => {
    try {
      setFaceStatus("Requesting camera...");
      await startCamera(videoEl);
      setFaceStatus("Camera ready.");
    } catch (e) {
      console.error(e);
      setFaceStatus(`Camera error: ${e.message || "UNKNOWN_ERROR"}`);
    }
  });

  // -----------------------
  // 2) Capture Face + Identify
  // -----------------------
  btnFaceCapture?.addEventListener("click", async () => {
    try {
      faceB64 = captureFrameBase64(videoEl, canvasEl);

      if (!faceB64) {
        setFaceStatus("Face frame not captured. Start camera first.");
        setFlowDebug("face_front", "failed", "NO_FACE_FRAME");
        return;
      }

      setFaceStatus("Identifying face...");
      const idRes = await apiIdentifyFace(faceB64);

      if (!idRes?.identified) {
        identifiedUser = null;
        const reason = (idRes?.reason || "").toUpperCase();
        if (reason === "EYES_CLOSED") {
          setFaceStatus("Eyes look closed. Please keep your eyes open and try again.");
          setFlowDebug("face_front", "failed", "EYES_CLOSED");
          return;
        }
        if (reason === "NO_FACE_DETECTED") {
          setFaceStatus("Face not detected clearly. Please center your full face in frame.");
          setFlowDebug("face_front", "failed", "NO_FACE_DETECTED");
          return;
        }
        if (reason === "FACE_NOT_FRONTAL") {
          setFaceStatus("Please look straight at the camera (frontal face required).");
          setFlowDebug("face_front", "failed", "FACE_NOT_FRONTAL");
          return;
        }
        if (reason === "EYES_NOT_CLEAR") {
          setFaceStatus("Eye state is not clear. Keep your full face visible and eyes open.");
          setFlowDebug("face_front", "failed", "EYES_NOT_CLEAR");
          return;
        }
        if (reason === "NO_MATCH") {
          setFaceStatus("Face not matched. Look straight at camera and try again.");
          setFlowDebug("face_front", "failed", "NO_MATCH");
          return;
        }

        setFaceStatus("Identification failed. Please align your face and try again.");
        setFlowDebug("face_front", "failed", reason || "IDENTIFY_FAILED");
        return;
      }

      identifiedUser = idRes.username || `user_id=${idRes.user_id}`;
      faceScore = Number(idRes.similarity ?? 0);
      setFaceStatus(
        `Identified: ${identifiedUser} (score ${faceScore.toFixed(3)})`
      );
      setFlowDebug("face_front", "passed", "IDENTIFIED", faceScore.toFixed(3));

      // Face tamam -> Liveness challenge step
      showStep("step-liveness");
      await loadIdentifyChallenge();

      // Show identified user banner
      if (identifiedUserName) setText(identifiedUserName, identifiedUser);
      if (identifiedUserBanner) identifiedUserBanner.style.display = "block";
    } catch (e) {
      console.error(e);
      setFaceStatus(`Identify failed: ${e.message || "UNKNOWN_ERROR"}`);
      setFlowDebug("face_front", "failed", "REQUEST_ERROR");
    }
  });

  // -----------------------
  // 3) Liveness actions
  // -----------------------
  btnCaptureChallengeAnswer?.addEventListener("click", async () => {
    try {
      if (currentTask() !== "answer") {
        setLivenessStatus(`Sira hatasi. Simdi yapman gereken: ${taskLabel(currentTask())}`);
        setFlowDebug(flowStepName(currentTask()), "failed", "STEP_ORDER_MISMATCH");
        return;
      }

      if (btnCaptureChallengeAnswer) btnCaptureChallengeAnswer.disabled = true;
      let answerText = (identifyChallengeAnswerEl?.value || "").trim();
      const startedAt = Date.now();
      const minRecordMs = 2500;

      setLivenessStatus("Challenge cevabi dinleniyor ve ses kimligi icin kaydediliyor...");
      await startVoiceRecording();

      if (!answerText) {
        answerText = await recognizeSpeechOnce({ lang: "tr-TR", timeoutMs: 8000 });
        if (identifyChallengeAnswerEl) identifyChallengeAnswerEl.value = answerText;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < minRecordMs) {
        await sleep(minRecordMs - elapsed);
      }

      const { b64 } = await stopVoiceRecordingToBase64();
      challengeVoiceB64 = b64;

      const v = await apiValidateIdentifyVoiceChallenge(identifyChallengeId, answerText);
      if (!v?.passed) {
        setLivenessStatus("Challenge cevabi gecersiz. Tekrar deneyin.");
        setFlowDebug("voice_answer", "failed", "INVALID_CHALLENGE_ANSWER");
        return;
      }

      setLivenessStatus(`Challenge kabul edildi: ${answerText}`);
      stepDone("answer");
    } catch (e) {
      console.error(e);
      try {
        await stopVoiceRecordingToBase64();
      } catch {}
      setLivenessStatus(`Speech capture failed: ${e.message || "UNKNOWN_ERROR"}`);
      setFlowDebug("voice_answer", "failed", "SPEECH_CAPTURE_FAILED");
    } finally {
      updateLivenessUI();
    }
  });

  btnRefreshIdentifyChallenge?.addEventListener("click", async () => {
    if (currentTask() !== "answer") {
      setLivenessStatus("Yeni soru sadece challenge adiminda alinabilir.");
      setFlowDebug(flowStepName(currentTask()), "failed", "INVALID_REFRESH_STEP");
      return;
    }
    await loadIdentifyChallenge();
  });

  identifyChallengeAnswerEl?.addEventListener("input", () => {
    updateLivenessUI();
  });

  btnCheckTurnRight?.addEventListener("click", async () => {
    try {
      if (currentTask() !== "turn_right") {
        setLivenessStatus(`Sira hatasi. Simdi yapman gereken: ${taskLabel(currentTask())}`);
        setFlowDebug(flowStepName(currentTask()), "failed", "STEP_ORDER_MISMATCH");
        return;
      }
      const frame = captureFrameBase64(videoEl, canvasEl);
      if (!frame) {
        setLivenessStatus("Start camera first.");
        setFlowDebug("turn_right", "failed", "NO_FACE_FRAME");
        return;
      }
      const res = await apiIdentifyPoseCheck(frame, "right");
      if (!res?.passed) {
        setLivenessStatus(`RIGHT turn failed (detected: ${res?.detected_turn || "none"}).`);
        setFlowDebug("turn_right", "failed", (res?.detected_turn || "none") === "none" ? "POSE_NOT_RIGHT" : `DETECTED_${String(res?.detected_turn || "none").toUpperCase()}`);
        return;
      }
      setLivenessStatus("RIGHT turn check passed.");
      stepDone("turn_right");
    } catch (e) {
      console.error(e);
      setLivenessStatus(`RIGHT turn check failed: ${e.message || "UNKNOWN_ERROR"}`);
      setFlowDebug("turn_right", "failed", "POSE_CHECK_ERROR");
    }
  });

  btnCheckTurnLeft?.addEventListener("click", async () => {
    try {
      if (currentTask() !== "turn_left") {
        setLivenessStatus(`Sira hatasi. Simdi yapman gereken: ${taskLabel(currentTask())}`);
        setFlowDebug(flowStepName(currentTask()), "failed", "STEP_ORDER_MISMATCH");
        return;
      }
      const frame = captureFrameBase64(videoEl, canvasEl);
      if (!frame) {
        setLivenessStatus("Start camera first.");
        setFlowDebug("turn_left", "failed", "NO_FACE_FRAME");
        return;
      }
      const res = await apiIdentifyPoseCheck(frame, "left");
      if (!res?.passed) {
        setLivenessStatus(`LEFT turn failed (detected: ${res?.detected_turn || "none"}).`);
        setFlowDebug("turn_left", "failed", (res?.detected_turn || "none") === "none" ? "POSE_NOT_LEFT" : `DETECTED_${String(res?.detected_turn || "none").toUpperCase()}`);
        return;
      }
      setLivenessStatus("LEFT turn check passed.");
      stepDone("turn_left");
    } catch (e) {
      console.error(e);
      setLivenessStatus(`LEFT turn check failed: ${e.message || "UNKNOWN_ERROR"}`);
      setFlowDebug("turn_left", "failed", "POSE_CHECK_ERROR");
    }
  });

  btnLivenessContinue?.addEventListener("click", async () => {
    try {
      if (!identifyChallengeId) {
        setLivenessStatus("Challenge not ready.");
        setFlowDebug("done", "failed", "CHALLENGE_NOT_READY");
        return;
      }
      if (currentTask()) {
        setLivenessStatus(`Once su adimi tamamla: ${taskLabel(currentTask())}`);
        setFlowDebug(flowStepName(currentTask()), "failed", "STEP_NOT_COMPLETED");
        return;
      }

      if (!challengeVoiceB64) {
        setLivenessStatus("Challenge sesi kaydedilemedi. Cevap adimini tekrar yapin.");
        setFlowDebug("voice_answer", "failed", "VOICE_NOT_RECORDED");
        return;
      }

      setLivenessStatus("Liveness tamamlandi. Ses kimligi dogrulaniyor...");

      const res = await apiAuthVerify({
        face_image_b64: faceB64,
        voice_wav_b64: challengeVoiceB64,
      });

      setText(decisionEl, res.decision || "-");
      setText(faceScoreEl, (res.face_score ?? faceScore ?? 0).toFixed(3));
      setText(voiceScoreEl, (res.voice_score ?? 0).toFixed(3));
      setText(fusionScoreEl, (res.fusion_score ?? 0).toFixed(3));
      setStatus(res.reason || "DONE");
      setFlowDebug("done", "passed", res.reason || "DONE", (res.fusion_score ?? 0).toFixed(3));
      showStep("step-result");

      if (res.decision === "ACCEPTED" || res.decision === "GRANTED") {
        setTimeout(() => {
          window.location.href = "../portal/dashboard_portal.html";
        }, 2000);
      }
    } catch (e) {
      console.error(e);
      setLivenessStatus(`Verification failed: ${e.message || "UNKNOWN_ERROR"}`);
      setFlowDebug("done", "failed", "VERIFY_FAILED");
    }
  });

  // -----------------------
  // 5) Restart
  // -----------------------
  function restart() {
    stopCamera([videoEl]);
    faceB64 = null;
    faceScore = 0;
    identifiedUser = null;
    identifyChallengeId = null;
    challengeVoiceB64 = null;
    livenessOrder = [];
    livenessStepIndex = 0;

    setFaceStatus("");
    setLivenessStatus("");
    setStatus("");

    if (identifiedUserBanner) identifiedUserBanner.style.display = "none";
    if (identifiedUserName) setText(identifiedUserName, "");
    if (identifyChallengeAnswerEl) identifyChallengeAnswerEl.value = "";
    setText(identifyChallengePromptEl, "Challenge question loading...");
    setFlowDebug("face_front", "waiting", "RESTARTED");

    if (btnLivenessContinue) btnLivenessContinue.disabled = true;

    showStep("step-face");
  }

  // -----------------------
  // 6) Back
  // -----------------------
  btnBack?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.assign("../portal/login_portal.html");
  });

  btnRestartResult?.addEventListener("click", restart);
  window.restartVerify = restart;
}