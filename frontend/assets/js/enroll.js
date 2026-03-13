import { byId, setText } from "./dom.js";
import { startCamera, stopCamera, captureFrameBase64 } from "./camera.js";
import {
  apiStartEnroll,
  apiPushFrame,
  apiFinishEnroll,
  apiEnrollVoiceBatch,
  apiGetVoiceChallenge,
} from "./api.js";
import {
  startVoiceRecording,
  stopVoiceRecordingToBase64,
  recognizeSpeechOnce,
} from "./voice.js";

export function initEnroll() {
  const enrollUserEl = byId("enrollUser");

  const faceStepEl = byId("faceStep");
  const voiceStepEl = byId("voiceStep");
  const completeStepEl = byId("completeStep");

  const stepIndicatorEl = byId("stepIndicator");
  const stepTitleEl = byId("stepTitle");
  const stepDescriptionEl = byId("stepDescription");

  const btnGoVoice = byId("btnGoVoice");
  const btnBackToFace = byId("btnBackToFace");
  const btnGoComplete = byId("btnGoComplete");
  const completeStatusEl = byId("completeStatus");

  const videoEl = byId("camVideo");
  const canvasEl = byId("camCanvas");

  const btnStartCam = byId("btnStartCam");
  const btnStopCam = byId("btnStopCam");
  const btnStartEnroll = byId("btnStartEnroll");
  const btnStopEnroll = byId("btnStopEnroll");

  const progressTextEl = byId("progressText");
  const progressBarEl = byId("progressBar");
  const angleStatusEl = byId("angleStatus");
  const angleGuideEl = byId("angleGuide");
  const statusTextEl = byId("statusText");

  const btnVoiceStart = byId("btnVoiceStart");
  const voiceChallengePromptEl = byId("voiceChallengePrompt");
  const voiceSampleProgressEl = byId("voiceSampleProgress");
  const voiceTranscriptPreviewEl = byId("voiceTranscriptPreview");
  const audioPreview = byId("audioPreview");
  const voiceStatusEl = byId("voiceStatus");

  const query = new URLSearchParams(window.location.search);
  const storageUsername = (localStorage.getItem("portalUsername") || "").trim();
  const storageRole = (localStorage.getItem("portalRole") || "").trim();
  const queryUsername = (query.get("username") || "").trim();
  const queryRole = (query.get("role") || "").trim();

  const username = storageUsername || queryUsername;
  const role = storageRole || queryRole || "user";
  const isLoggedIn = localStorage.getItem("portalLoggedIn") === "true";

  if (enrollUserEl) {
    enrollUserEl.textContent = username ? username : "Not signed in";
  }

  if (!storageUsername && queryUsername) {
    localStorage.setItem("portalUsername", queryUsername);
  }
  if (!storageRole && queryRole) {
    localStorage.setItem("portalRole", queryRole);
  }

  if ((!isLoggedIn && !queryUsername) || !username) {
    window.location.href = "../portal/office_login.html";
    return;
  }

  let sessionId = null;
  let isCapturing = false;
  let captureTimer = null;
  let frameInFlight = false;
  let targetSamples = 15;
  let acceptedSamples = 0;
  let voiceB64 = null;
  let voiceChallengeId = null;
  let voiceSamples = [];
  let voiceListening = false;
  let faceEnrollmentCompleted = false;
  let voiceEnrollmentCompleted = false;

  function setStatus(msg) {
    setText(statusTextEl, msg);
    console.log("[ENROLL]", msg);
  }

  function setVoiceStatus(msg) {
    setText(voiceStatusEl, msg);
    console.log("[VOICE]", msg);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function setAngleStatus(requiredAngle, angleCounts) {
    const counts = angleCounts || { center: 0, left: 0, right: 0 };
    setText(
      angleStatusEl,
      `Required angle: ${requiredAngle} (center:${counts.center} left:${counts.left} right:${counts.right})`
    );

    const mirroredHint = {
      center: "DUZ BAK: Kameraya tam karsidan bak.",
      left: "AYNA MODU: Basini KENDI SAGINA cevir (kamera SOL bekliyor).",
      right: "AYNA MODU: Basini KENDI SOLUNA cevir (kamera SAG bekliyor).",
    };
    setText(
      angleGuideEl,
      mirroredHint[requiredAngle] || "Yuzunu kamerada istenen yone cevir."
    );
  }

  function updateVoiceSampleProgress() {
    const current = Math.min(voiceSamples.length + 1, 3);
    setText(voiceSampleProgressEl, `Saved ${voiceSamples.length}/3 samples. Current prompt ${current}/3`);
  }

  function resetCurrentVoiceCapture() {
    voiceB64 = null;
    setText(voiceTranscriptPreviewEl, "Waiting for answer...");
    if (audioPreview) {
      audioPreview.pause?.();
      audioPreview.src = "";
      audioPreview.classList.add("hidden");
    }
  }

  function setProgress(count, target) {
    acceptedSamples = count;
    targetSamples = target;

    setText(progressTextEl, `${count}/${target}`);

    if (progressBarEl) {
      const pct =
        target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;
      progressBarEl.style.width = `${pct}%`;
    }
  }

  function showFaceStep() {
    faceStepEl?.classList.remove("hidden");
    voiceStepEl?.classList.add("hidden");
    completeStepEl?.classList.add("hidden");

    setText(stepIndicatorEl, "Step 1 of 2");
    setText(stepTitleEl, "Face Enrollment");
    setText(
      stepDescriptionEl,
      "Start the camera, then begin enrollment. The system will collect multiple face samples automatically."
    );
  }

  function showVoiceStep() {
    faceStepEl?.classList.add("hidden");
    voiceStepEl?.classList.remove("hidden");
    completeStepEl?.classList.add("hidden");

    setText(stepIndicatorEl, "Step 2 of 2");
    setText(stepTitleEl, "Voice Enrollment");
    setText(
      stepDescriptionEl,
      "Speak the shown prompt, stop recording, type the short answer you said, then save the sample. After 3 samples voice enrollment completes automatically."
    );

    if (!voiceChallengeId) {
      loadVoiceChallenge();
    }
    updateVoiceSampleProgress();
  }

  async function loadVoiceChallenge() {
    try {
      const usedIds = voiceSamples.map((sample) => sample.challenge_id);
      const challenge = await apiGetVoiceChallenge(usedIds);
      voiceChallengeId = challenge?.challenge_id || null;
      setText(
        voiceChallengePromptEl,
        challenge?.prompt || "Please answer the displayed challenge question."
      );
      resetCurrentVoiceCapture();
      if (btnVoiceStart) btnVoiceStart.disabled = false;
    } catch (e) {
      console.error(e);
      setText(voiceChallengePromptEl, "Challenge question unavailable.");
      voiceChallengeId = null;
    }
  }

  function showCompleteStep() {
    faceStepEl?.classList.add("hidden");
    voiceStepEl?.classList.add("hidden");
    completeStepEl?.classList.remove("hidden");

    setText(stepIndicatorEl, "Completed");
    setText(stepTitleEl, "Enrollment Completed");
    setText(
      stepDescriptionEl,
      "Your face and voice enrollment steps have been completed successfully."
    );
    setText(
      completeStatusEl,
      "Biometric enrollment completed successfully."
    );
  }

  function updateStepButtons() {
    if (btnGoVoice) {
      btnGoVoice.disabled = !faceEnrollmentCompleted;
    }

    if (btnGoComplete) {
      btnGoComplete.disabled = !voiceEnrollmentCompleted;
    }
  }

  async function stopEnrollmentFlow(doFinish) {
    if (!isCapturing) return;

    isCapturing = false;

    if (captureTimer) {
      clearInterval(captureTimer);
      captureTimer = null;
    }

    if (btnStartEnroll) btnStartEnroll.disabled = false;
    if (btnStopEnroll) btnStopEnroll.disabled = true;

    if (doFinish && sessionId) {
      try {
        const result = await apiFinishEnroll(sessionId);
        const nSamples = result?.n_samples ?? acceptedSamples;
        setStatus(`Saved: ${result?.status || "OK"} (samples: ${nSamples})`);

        const status = (result?.status || "").toUpperCase();
        console.log("[FACE FINISH STATUS]", status);
        console.log("[FACE FINISH NSAMPLES]", nSamples);

        // sample geldiyse veya backend olumlu bir status döndüyse tamam kabul et
        if (
          nSamples > 0 ||
          status === "ENROLLED" ||
          status === "FACE_UPDATED" ||
          status === "FACE_ALREADY_REGISTERED"
        ) {
          faceEnrollmentCompleted = true;
          updateStepButtons();
          console.log("[FACE COMPLETED]", faceEnrollmentCompleted);
          setStatus(`Face enrollment complete. Switching to voice step...`);
          
          setTimeout(() => {
            console.log("[DEBUG] Calling showVoiceStep()");
            showVoiceStep();
          }, 300);
        }
      } catch (e) {
        console.error(e);
        setStatus(`Finish error: ${e.message || "UNKNOWN_ERROR"}`);
      }
    } else {
      setStatus("Enrollment stopped.");
    }
  }

  btnStartCam?.addEventListener("click", async () => {
    try {
      setStatus("Requesting camera...");
      await startCamera(videoEl);
      setStatus("Camera ready.");
    } catch (e) {
      console.error(e);
      setStatus(`Camera error: ${e.message || "UNKNOWN_ERROR"}`);
    }
  });

  btnStopCam?.addEventListener("click", () => {
    stopCamera([videoEl]);
    setStatus("Camera stopped.");
  });

  btnStartEnroll?.addEventListener("click", async () => {
    if (isCapturing) return;

    const hasCamera = !!videoEl?.srcObject;
    if (!hasCamera) {
      setStatus("Start camera first.");
      return;
    }

    try {
      setStatus("Starting enrollment...");
      setProgress(0, 15);
      sessionId = null;

      const startRes = await apiStartEnroll(username, role);
      sessionId = startRes?.session_id || null;
      setProgress(0, startRes?.target || 15);
      setAngleStatus(startRes?.required_angle || "center", {
        center: 0,
        left: 0,
        right: 0,
      });

      isCapturing = true;
      if (btnStartEnroll) btnStartEnroll.disabled = true;
      if (btnStopEnroll) btnStopEnroll.disabled = false;

      setStatus("Enrollment started. Collecting samples...");

      captureTimer = setInterval(async () => {
        if (!isCapturing || frameInFlight) return;

        const faceB64 = captureFrameBase64(videoEl, canvasEl);
        if (!faceB64) return;

        frameInFlight = true;

        try {
          const r = await apiPushFrame(sessionId, faceB64);

          if (r?.accepted) {
            setProgress(r.count ?? acceptedSamples, r.target ?? targetSamples);
            setAngleStatus(r?.required_angle || "center", r?.angle_counts);
          } else if (r?.reason) {
            setStatus(`Collecting... (${r.reason})`);
            setAngleStatus(r?.required_angle || "center", r?.angle_counts);
          }

          const reached =
            r?.reason === "TARGET_REACHED" ||
            ((r?.count ?? 0) >= (r?.target ?? targetSamples) &&
              (r?.target ?? targetSamples) > 0);

          if (reached) {
            setStatus("Target reached. Saving...");
            await stopEnrollmentFlow(true);
          }
        } catch (e) {
          console.error(e);
          setStatus(`Frame error: ${e.message || "UNKNOWN_ERROR"}`);
        } finally {
          frameInFlight = false;
        }
      }, 220);
    } catch (e) {
      console.error(e);
      setStatus(`Start error: ${e.message || "UNKNOWN_ERROR"}`);
      isCapturing = false;
      if (btnStartEnroll) btnStartEnroll.disabled = false;
      if (btnStopEnroll) btnStopEnroll.disabled = true;
    }
  });

  btnStopEnroll?.addEventListener("click", async () => {
    await stopEnrollmentFlow(false);
  });

  btnVoiceStart?.addEventListener("click", async () => {
    try {
      voiceB64 = null;
      if (voiceListening) return;
      voiceListening = true;
      if (btnVoiceStart) btnVoiceStart.disabled = true;
      const startedAt = Date.now();
      const minRecordMs = 2500;

      setVoiceStatus("Listening... Answer the prompt naturally. When your answer is heard, the next question will load automatically.");
      await startVoiceRecording();
      const transcript = await recognizeSpeechOnce({ lang: "tr-TR", timeoutMs: 9000 });
      const elapsed = Date.now() - startedAt;
      if (elapsed < minRecordMs) {
        await sleep(minRecordMs - elapsed);
      }
      const { blob, b64 } = await stopVoiceRecordingToBase64();
      voiceB64 = b64;

      if (audioPreview) {
        audioPreview.src = URL.createObjectURL(blob);
        audioPreview.classList.remove("hidden");
      }

      setText(voiceTranscriptPreviewEl, transcript);
      setVoiceStatus("Answer heard. Saving sample...");

      if (!voiceChallengeId) {
        throw new Error("Challenge question not ready.");
      }
      if (voiceSamples.length >= 3) {
        setVoiceStatus("Already collected 3 samples.");
        return;
      }

      voiceSamples.push({
        voice_wav_b64: voiceB64,
        challenge_id: voiceChallengeId,
        challenge_answer_text: transcript,
      });

      setVoiceStatus(`Sample ${voiceSamples.length}/3 saved.`);
      updateVoiceSampleProgress();

      if (voiceSamples.length < 3) {
        await loadVoiceChallenge();
        setVoiceStatus(`Sample ${voiceSamples.length}/3 saved. Next prompt loaded automatically.`);
        return;
      }

      if (btnVoiceStart) btnVoiceStart.disabled = true;
      setText(voiceChallengePromptEl, "3 samples captured. Finalizing voice enrollment...");
      setVoiceStatus("Saving merged voice template from 3 samples...");

      const res = await apiEnrollVoiceBatch(
        username,
        role,
        voiceSamples
      );
      console.log("[VOICE ENROLL STATUS]", res?.status, res?.reason || "");

      if ((res?.status || "").toUpperCase() === "FAILED") {
        const detail = res?.detail ? ` (${JSON.stringify(res.detail)})` : "";
        setVoiceStatus(
          `Voice enroll failed: ${res?.reason || "UNKNOWN_ERROR"}${detail}`
        );
      } else {
        setVoiceStatus(
          res?.status ? `Voice enrolled: ${res.status}` : "Voice enrolled."
        );
      }

      const status = (res?.status || "").toUpperCase();

      if (
        status === "VOICE_ENROLLED" ||
        status === "VOICE_UPDATED" ||
        status === "VOICE_ALREADY_REGISTERED"
      ) {
        voiceEnrollmentCompleted = true;
        updateStepButtons();
        setVoiceStatus("Voice enrollment complete. Click 'Finish Enrollment' to complete.");
        setText(voiceSampleProgressEl, "Saved 3/3 samples. Voice enrollment completed.");
      }
    } catch (e) {
      console.error(e);
      try {
        if (voiceListening) {
          await stopVoiceRecordingToBase64();
        }
      } catch {}
      setVoiceStatus(`Voice enroll failed: ${e.message || "UNKNOWN_ERROR"}`);
      if (btnVoiceStart) btnVoiceStart.disabled = false;
    } finally {
      voiceListening = false;
    }
  });

  btnGoVoice?.addEventListener("click", () => {
    console.log("[GO VOICE CLICKED]");
    console.log("[FACE COMPLETED STATE]", faceEnrollmentCompleted);

    if (!faceEnrollmentCompleted) {
      setStatus("Complete face enrollment first.");
      return;
    }

    showVoiceStep();
  });

  btnBackToFace?.addEventListener("click", () => {
    showFaceStep();
  });

  btnGoComplete?.addEventListener("click", () => {
    if (!voiceEnrollmentCompleted) {
      setVoiceStatus("Complete voice enrollment first.");
      return;
    }
    showCompleteStep();
  });

  setProgress(0, targetSamples);
  setAngleStatus("center", { center: 0, left: 0, right: 0 });
  updateVoiceSampleProgress();
  setText(voiceTranscriptPreviewEl, "Waiting for answer...");
  setStatus("Ready.");
  setVoiceStatus("Ready.");

  if (btnStopEnroll) btnStopEnroll.disabled = true;

  faceEnrollmentCompleted = false;
  voiceEnrollmentCompleted = false;
  updateStepButtons();
  showFaceStep();
}