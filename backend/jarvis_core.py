# backend/jarvis_core.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import logging
from datetime import datetime

from voice.pipeline import synthesize_speech, transcribe_audio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("JARVIS")

# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("JARVIS online.")
    yield
    logger.info("JARVIS shutting down.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "online",
        "time": datetime.now().isoformat()
    }

# ─────────────────────────────────────────────
# CHAT WS (REAL-TIME + TTS STREAM)
# ─────────────────────────────────────────────
@app.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    await websocket.accept()
    logger.info("Chat connected")

    speaking_task = None

    async def send_json(data):
        try:
            await websocket.send_text(json.dumps(data))
        except:
            pass

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            user_msg = data.get("message", "")
            if not user_msg:
                continue

            # 🔥 FAKE LLM (replace with yours)
            response = f"Understood. You said: {user_msg}. I am processing your request now."

            await send_json({
                "type": "start"
            })

            full_text = ""
            sentence_buffer = ""

            # 🔥 simulate streaming
            for word in response.split():
                chunk = word + " "
                full_text += chunk
                sentence_buffer += chunk

                await send_json({
                    "type": "chunk",
                    "content": chunk
                })

                # 🔊 STREAM SPEECH PER SENTENCE
                if any(p in sentence_buffer for p in [".", "!", "?"]):
                    if speaking_task:
                        speaking_task.cancel()

                    speaking_task = asyncio.create_task(
                        stream_tts(sentence_buffer, websocket)
                    )

                    sentence_buffer = ""

                await asyncio.sleep(0.05)

            # leftover speech
            if sentence_buffer.strip():
                await stream_tts(sentence_buffer, websocket)

            await send_json({
                "type": "done"
            })

    except WebSocketDisconnect:
        logger.info("Chat disconnected")

# ─────────────────────────────────────────────
# 🔊 STREAM TTS FUNCTION
# ─────────────────────────────────────────────
async def stream_tts(text: str, websocket: WebSocket):
    try:
        audio = await synthesize_speech(text)
        await websocket.send_bytes(audio)
    except Exception as e:
        logger.error(f"TTS stream error: {e}")

# ─────────────────────────────────────────────
# 🎙️ STT WS
# ─────────────────────────────────────────────
@app.websocket("/ws/stt")
async def stt_ws(websocket: WebSocket):
    await websocket.accept()
    logger.info("STT connected")

    buffer = b""
    CHUNK_SIZE = 32000  # 🔥 better size

    try:
        while True:
            chunk = await websocket.receive_bytes()
            buffer += chunk

            if len(buffer) > CHUNK_SIZE:
                text = await transcribe_audio(buffer)
                buffer = b""

                if text:
                    await websocket.send_text(json.dumps({
                        "type": "final",
                        "text": text
                    }))

    except WebSocketDisconnect:
        logger.info("STT disconnected")