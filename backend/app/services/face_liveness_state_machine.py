from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
import time
from typing import Final, Optional


class Step(str, Enum):
    VISUAL_ID = "VISUAL_ID"
    TURN_RIGHT = "TURN_RIGHT"
    TURN_LEFT = "TURN_LEFT"
    BLINK = "BLINK"
    SUCCESS = "SUCCESS"
    FAIL = "FAIL"


@dataclass
class LivenessState:
    current: int = 0
    attempts: int = 0
    step_started_at: float = 0.0
    done: bool = False
    failed: bool = False
    reason: str = ""
    blink_baseline: Optional[float] = None

    # VISUAL_ID (look straight) timer
    visual_ok_started_at: Optional[float] = None


class FaceLivenessStateMachine:
    STEPS: Final[list[Step]] = [
        Step.VISUAL_ID,
        Step.TURN_RIGHT,
        Step.TURN_LEFT,
        Step.BLINK,
    ]

    # --- VISUAL_ID: user must keep face centered for N seconds ---
    VISUAL_ID_HOLD_SEC: Final[float] = 4.0
    CENTER_MIN: Final[float] = 0.45
    CENTER_MAX: Final[float] = 0.55

    # --- Head turn thresholds (nose_x normalized 0..1) ---
    RIGHT_THRESHOLD: Final[float] = 0.60
    LEFT_THRESHOLD: Final[float] = 0.40

    # --- Timeouts / retries ---
    STEP_TIMEOUT_SEC: Final[float] = 6.0
    MAX_RETRY_PER_STEP: Final[int] = 1

    def __init__(self) -> None:
        self.state = LivenessState(step_started_at=time.time())

    def reset(self) -> None:
        self.state = LivenessState(step_started_at=time.time())

    def _timeout_exceeded(self) -> bool:
        return (time.time() - self.state.step_started_at) > self.STEP_TIMEOUT_SEC

    def _reset_timer(self) -> None:
        self.state.step_started_at = time.time()

    def current_step(self) -> Optional[Step]:
        if self.state.done:
            return Step.SUCCESS if not self.state.failed else Step.FAIL
        if self.state.current >= len(self.STEPS):
            return Step.SUCCESS
        return self.STEPS[self.state.current]

    def instruction(self) -> str:
        step = self.current_step()
        if step == Step.VISUAL_ID:
            return f"Please look at the camera (hold {int(self.VISUAL_ID_HOLD_SEC)}s)."
        if step == Step.TURN_RIGHT:
            return "Turn your head to RIGHT."
        if step == Step.TURN_LEFT:
            return "Turn your head to LEFT."
        if step == Step.BLINK:
            return "Blink your eyes."
        if step == Step.SUCCESS:
            return "Liveness SUCCESS."
        return "Liveness FAILED."

    def update(
        self,
        *,
        nose_x: float | None,
        eye_open_ratio: float | None,
        face_detected: bool,
    ) -> LivenessState:
        if self.state.done:
            return self.state

        if not face_detected:
            # If face is not detected long enough -> fail
            if self._timeout_exceeded():
                return self._fail("NO_FACE_TIMEOUT")
            # while face missing, do not advance
            return self.state

        step = self.STEPS[self.state.current]

        ok = self._check_step(
            step,
            nose_x=nose_x,
            eye_open_ratio=eye_open_ratio,
        )

        if ok:
            self.state.current += 1
            self._reset_timer()
            self.state.attempts = 0

            # reset per-step helpers
            self.state.blink_baseline = None
            self.state.visual_ok_started_at = None

            if self.state.current >= len(self.STEPS):
                self.state.done = True
                self.state.failed = False
                self.state.reason = "LIVENESS_SUCCESS"

            return self.state

        # Step not completed: check timeout / retries
        if self._timeout_exceeded():
            if self.state.attempts < self.MAX_RETRY_PER_STEP:
                self.state.attempts += 1
                self._reset_timer()

                # reset step helper timers on retry
                self.state.blink_baseline = None
                self.state.visual_ok_started_at = None

                return self.state

            return self._fail(f"STEP_TIMEOUT_{step.value}")

        return self.state

    def _check_step(
        self,
        step: Step,
        *,
        nose_x: float | None,
        eye_open_ratio: float | None,
    ) -> bool:
        # 1) LOOK STRAIGHT: nose_x must be near center for VISUAL_ID_HOLD_SEC
        if step == Step.VISUAL_ID:
            if nose_x is None:
                self.state.visual_ok_started_at = None
                return False

            # Start/continue timer only if face is centered
            if self.CENTER_MIN <= nose_x <= self.CENTER_MAX:
                if self.state.visual_ok_started_at is None:
                    self.state.visual_ok_started_at = time.time()

                held = time.time() - self.state.visual_ok_started_at
                return held >= self.VISUAL_ID_HOLD_SEC

            # Not centered => reset timer
            self.state.visual_ok_started_at = None
            return False

        # 2) TURN RIGHT
        if step == Step.TURN_RIGHT:
            return nose_x is not None and nose_x > self.RIGHT_THRESHOLD

        # 3) TURN LEFT
        if step == Step.TURN_LEFT:
            return nose_x is not None and nose_x < self.LEFT_THRESHOLD

        # 4) BLINK (eye_open_ratio drop)
        if step == Step.BLINK:
            if eye_open_ratio is None:
                return False

            # Save baseline once
            if self.state.blink_baseline is None:
                self.state.blink_baseline = eye_open_ratio
                return False

            # If eye openness drops by ~40% => blink
            if eye_open_ratio < self.state.blink_baseline * 0.6:
                return True

            return False

        return False

    def _fail(self, reason: str) -> LivenessState:
        self.state.done = True
        self.state.failed = True
        self.state.reason = reason
        return self.state
