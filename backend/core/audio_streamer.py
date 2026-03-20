import webrtcvad

# Constants used by main.py and other modules
SAMPLE_RATE = 16000
FRAME_DURATION_MS = 30  # ms
# VAD aggressiveness (0-3). 3 is most aggressive at filtering out non-speech.
vad = webrtcvad.Vad(3)

def frame_generator(frame_duration_ms, audio_buffer, sample_rate):
    """
    Yields chunks of audio data (frames) from the buffer.
    Each frame must be of a specific duration for WebRTC VAD to work.
    """
    n = int(sample_rate * (frame_duration_ms / 1000.0) * 2)
    offset = 0
    while offset + n <= len(audio_buffer):
        yield audio_buffer[offset:offset + n]
        offset += n

def is_speech_detected(frame, sample_rate):
    """
    Wrapper for WebRTC VAD to check if a specific frame contains speech.
    """
    return vad.is_speech(frame, sample_rate)