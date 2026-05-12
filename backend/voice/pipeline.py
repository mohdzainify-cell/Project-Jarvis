"""
JARVIS Voice Pipeline — CLEAN & WORKING

Features:
- Speech-to-Text (Whisper via faster-whisper)
- Text-to-Speech (edge-tts)
- WebM → WAV conversion using ffmpeg (CRITICAL FIX)
"""

import asyncio
import tempfile
import subprocess
import os
import logging

logger = logging.getLogger("JARVIS.Voice")


# ─────────────────────────────────────────────────────────────
# 🔊 TEXT TO SPEECH (TTS)
# ─────────────────────────────────────────────────────────────
async def synthesize_speech(text: str) -> bytes:
    """
    Convert text → speech (MP3 bytes)
    Uses Microsoft Edge Neural voices (fast + high quality)
    """
    if not text or not text.strip():
        return b""

    try:
        import edge_tts

        voice = "en-GB-RyanNeural"  # JARVIS-style voice

        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate="+5%",
            pitch="-5Hz"
        )

        audio_bytes = b""

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]

        if not audio_bytes:
            raise Exception("No audio generated")

        return audio_bytes

    except Exception as e:
        logger.error(f"TTS failed: {e}")
        return b""


# ─────────────────────────────────────────────────────────────
# 🎙️ SPEECH TO TEXT (STT)
# ─────────────────────────────────────────────────────────────
async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Convert audio bytes → text
    Uses faster-whisper (local, free)
    """
    if not audio_bytes:
        return ""

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        _transcribe_sync,
        audio_bytes
    )


def _transcribe_sync(audio_bytes: bytes) -> str:
    """
    Sync transcription (runs in thread)
    """
    from faster_whisper import WhisperModel

    model = WhisperModel(
        "tiny",
        device="cpu",
        compute_type="int8"
    )

    # ── Save incoming WebM audio ──
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        webm_path = f.name
        f.write(audio_bytes)

    wav_path = webm_path.replace(".webm", ".wav")

    try:
        # ── 🔥 CRITICAL FIX: Convert WebM → WAV ──
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", webm_path,
                "-ar", "16000",  # sample rate
                "-ac", "1",      # mono
                wav_path
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        # ── Transcribe ──
        segments, _ = model.transcribe(
            wav_path,
            language="en"
        )

        text = " ".join([seg.text for seg in segments]).strip()

        return text

    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return ""

    finally:
        # ── Cleanup temp files ──
        try:
            if os.path.exists(webm_path):
                os.unlink(webm_path)
            if os.path.exists(wav_path):
                os.unlink(wav_path)
        except Exception:
            pass