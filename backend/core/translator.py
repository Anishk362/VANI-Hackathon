import asyncio
from deep_translator import GoogleTranslator

# Initialize translator instance once
_translator = GoogleTranslator(source='auto', target='en')

async def translate_to_english(text: str) -> str:
    """
    Translates the native text from the Web Speech API into English.
    The translation is run in a separate thread to avoid blocking the FastAPI event loop.
    """
    if not text or not text.strip():
        return ""
    
    try:
        # translate() is synchronous, so wrap it in to_thread
        translated = await asyncio.to_thread(_translator.translate, text)
        return translated or text
    except Exception as e:
        print(f"[Translator Error] {e}")
        return text  # fallback to returning original string
