# backend/core/audio_streamer.py
import asyncio
import io
import websockets
import audioop
from whisper_engine import process_audio

WS_URI = "ws://localhost:8000/ws/stream"

# 16kHz, mono, 16-bit PCM
SAMPLE_RATE = 16000
FRAME_DURATION_MS = 30  # 10, 20, or 30 ms frames
SILENCE_THRESHOLD = 500  # adjust for your mic volume

def frame_generator(frame_duration_ms, audio, sample_rate):
    """Generates 16-bit PCM frames from audio bytes"""
    n = int(sample_rate * (frame_duration_ms / 1000.0) * 2)  # 2 bytes per sample
    for i in range(0, len(audio), n):
        yield audio[i:i+n]

def is_speech(frame, threshold=SILENCE_THRESHOLD):
    """Simple RMS-based voice activity detection"""
    if len(frame) == 0:
        return False
    rms = audioop.rms(frame, 2)  # 2 bytes per sample
    return rms > threshold

async def audio_streamer():
    async with websockets.connect(WS_URI) as websocket:
        buffer = io.BytesIO()
        print("Connected to WebSocket")
        while True:
            audio_chunk = await websocket.recv()
            if isinstance(audio_chunk, bytes):
                buffer.write(audio_chunk)

                frames = list(frame_generator(FRAME_DURATION_MS, buffer.getvalue(), SAMPLE_RATE))
                speech_frames = [f for f in frames if is_speech(f)]

                # If >3 sec speech detected, send to Whisper
                if len(speech_frames) * FRAME_DURATION_MS / 1000.0 >= 3:
                    buffer.seek(0)
                    await process_audio(buffer, websocket)
                    buffer = io.BytesIO()  # reset buffer

async def main():
    await audio_streamer()

if __name__ == "__main__":
    asyncio.run(main())