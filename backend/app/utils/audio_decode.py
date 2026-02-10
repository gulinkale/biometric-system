import base64
import io
import numpy as np
from pydub import AudioSegment


def decode_voice_base64_to_np(voice_b64: str) -> tuple[np.ndarray, int]:
    """
    Browser MediaRecorder output is usually webm/opus (sometimes ogg/opus).
    Convert to mono 16kHz PCM and return (audio_np[-1..1], sr).
    Requires ffmpeg installed on OS.
    """
    raw = base64.b64decode(voice_b64)

    audio_seg = None
    for fmt in ("webm", "ogg", "wav", "mp3"):
        try:
            audio_seg = AudioSegment.from_file(io.BytesIO(raw), format=fmt)
            break
        except Exception:
            continue

    if audio_seg is None:
        raise ValueError("VOICE_FORMAT_UNSUPPORTED")

    # normalize format: mono, 16kHz, 16-bit PCM
    audio_seg = audio_seg.set_frame_rate(16000).set_channels(1).set_sample_width(2)

    sr = audio_seg.frame_rate
    samples = np.array(audio_seg.get_array_of_samples()).astype(np.float32)

    # int16 -> float32 [-1,1]
    samples /= 32768.0

    return samples, sr
