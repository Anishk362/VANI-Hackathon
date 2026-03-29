// [Member 3 - Abhinav] frontend/src/components/customer_tablet/WelcomeScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LanguageSelector } from './LanguageSelector';
import { vaniWS } from '../../services/websocketService';

type Screen = 'welcome' | 'confirming' | 'voice';

export interface WelcomeScreenProps {
  onLanguageSelect: (languageCode: string, languageName: string) => void;
}

interface ChatMessage {
  id: number;
  text: string;
  role: 'agent' | 'user';
}

// Create a global interface for the SpeechRecognition API to avoid TS errors
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VANIMicProps {
  active: boolean;
  onClick: () => void;
  size?: 'large' | 'small';
  ariaLabel?: string;
}

function MicrophoneGlyph({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1.75a3.5 3.5 0 0 0-3.5 3.5v6.5a3.5 3.5 0 1 0 7 0v-6.5A3.5 3.5 0 0 0 12 1.75Z"
        fill="currentColor"
      />
      <path
        d="M18 10.75a1 1 0 0 0-1 1V12a5 5 0 1 1-10 0v-.25a1 1 0 0 0-2 0V12a7.01 7.01 0 0 0 6 6.93V21H8.5a1 1 0 1 0 0 2h7a1 1 0 1 0 0-2H13v-2.07A7.01 7.01 0 0 0 19 12v-.25a1 1 0 0 0-1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

const VANIMic: React.FC<VANIMicProps> = ({
  active,
  onClick,
  size = 'large',
  ariaLabel = 'Microphone',
}) => {
  const isLarge = size === 'large';
  const coreSize = isLarge ? 80 : 60;

  return (
    <button
      className={`vani-mic-orb ${active ? 'is-active' : ''} ${isLarge ? 'vani-mic-orb--large' : 'vani-mic-orb--small'}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      type="button"
    >
      <div className="vani-mic-orb__ring vani-mic-orb__ring--1" />
      <div className="vani-mic-orb__ring vani-mic-orb__ring--2" />
      <div className="vani-mic-orb__ring vani-mic-orb__ring--3" />
      <div className="vani-mic-orb__core" style={{ width: coreSize, height: coreSize }}>
        <MicrophoneGlyph className="mic-icon-svg" />
      </div>
    </button>
  );
};

interface InlineVoiceInputProps {
  recording: boolean;
  elapsed: number;
  onToggle: () => void;
}

const InlineVoiceInput: React.FC<InlineVoiceInputProps> = ({ recording, elapsed, onToggle }) => {
  const [heights, setHeights] = useState<number[]>(new Array(48).fill(2));

  useEffect(() => {
    let intervalId: number;
    if (recording) {
      intervalId = window.setInterval(() => {
        setHeights(Array.from({ length: 48 }, () => 10 + Math.random() * 90));
      }, 90);
    } else {
      setHeights(new Array(48).fill(2));
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [recording]);

  const fmt = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="inline-voice-input">
      <div className="inline-voice-bars">
        {heights.map((h, i) => (
          <div
            key={i}
            className={`inline-voice-bar ${recording ? 'active' : ''}`}
            style={{ height: recording ? `${h}%` : '2px' }}
          />
        ))}
      </div>
      <button 
        className={`mic-btn ${recording ? 'active' : ''}`} 
        onClick={onToggle} 
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        type="button"
      >
        {recording && (
          <>
            <div className="vani-mic-orb__ring vani-mic-orb__ring--1" />
            <div className="vani-mic-orb__ring vani-mic-orb__ring--2" />
            <div className="vani-mic-orb__ring vani-mic-orb__ring--3" />
          </>
        )}
        <MicrophoneGlyph className="mic-icon-svg" />
      </button>
      <span className={`inline-voice-timer ${recording ? 'active' : ''}`}>
        {fmt(elapsed)}
      </span>
      <span className={`inline-voice-hint ${recording ? 'active' : ''}`}>
        {recording ? 'Listening...' : 'Tap to speak'}
      </span>
    </div>
  );
};

const CONFIRMATION_MESSAGES: Record<string, string> = {
  en: 'Language selected. You may speak now.',
  hi: 'भाषा चुनी गई। अब आप बोल सकते हैं।',
  mr: 'भाषा निवडली. आता बोला.',
  ta: 'மொழி தேர்ந்தெடுக்கப்பட்டது. இப்போது பேசலாம்.',
  te: 'భాష ఎంచుకోబడింది. ఇప్పుడు మాట్లాడవచ్చు.',
  bn: 'ভাষা নির্বাচিত। এখন কথা বলুন।',
  gu: 'ભાષા પસંદ કરી. હવે બોલો.',
  kn: 'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಈಗ ಮಾತನಾಡಿ.',
  ml: 'ഭാഷ തിരഞ്ഞെടുത്തു. ഇപ്പോൾ സംസാരിക്കൂ.',
  pa: 'ਭਾਸ਼ਾ ਚੁਣੀ ਗਈ। ਹੁਣ ਬੋਲੋ।',
  or: 'ଭାଷା ଚୟନ ହୋଇଛି। ବର୍ତ୍ତମାନ କଥା ହୁଅନ୍ତୁ।',
  ur: 'زبان منتخب ہوئی۔ اب بولیں۔',
  ar: 'تم اختيار اللغة. يمكنك التحدث الآن.',
  zh: '语言已选择。您现在可以说话了。',
  ja: '言語が選択されました。今話してください。',
  ko: '언어가 선택되었습니다. 이제 말씀하세요.',
  es: 'Idioma seleccionado. Puede hablar ahora.',
  fr: 'Langue sélectionnée. Vous pouvez parler maintenant.',
  de: 'Sprache ausgewählt. Sie können jetzt sprechen.',
  ru: 'Язык выбран. Вы можете говорить.',
};

const GREETINGS: Record<string, string> = {
  en: "Hello! I'm V.A.N.I, your banking assistant. How can I help you today?",
  hi: 'नमस्ते! मैं V.A.N.I हूँ, आपकी बैंकिंग सहायक। आज मैं आपकी कैसे मदद कर सकती हूँ?',
  mr: 'नमस्कार! मी V.A.N.I आहे, तुमची बँकिंग सहाय्यक. आज मी तुम्हाला कशी मदत करू?',
  ta: 'வணக்கம்! நான் V.A.N.I, உங்கள் வங்கி உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவலாம்?',
  te: 'నమస్కారం! నేను V.A.N.I, మీ బ్యాంకింగ్ సహాయకుడు. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
  bn: 'নমস্কার! আমি V.A.N.I, আপনার ব্যাংকিং সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  gu: 'નમસ્તે! હું V.A.N.I છું, તમારો બેંકિંગ સહાયક.',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು V.A.N.I, ನಿಮ್ಮ ಬ್ಯಾಂಕಿಂಗ್ ಸಹಾಯಕ.',
  ml: 'നമസ്കാരം! ഞാൻ V.A.N.I, നിങ്ങളുടെ ബാങ്കിംഗ് അസിസ്റ്റന്റ്.',
  pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ V.A.N.I ਹਾਂ, ਤੁਹਾਡਾ ਬੈਂਕਿੰਗ ਸਹਾਇਕ.',
  ar: 'مرحباً! أنا V.A.N.I، مساعدك المصرفي.',
  zh: '您好！我是V.A.N.I，您的银行助手。',
  ja: 'こんにちは！私はV.A.N.Iです、あなたの銀行アシスタント。',
  ko: '안녕하세요! 저는 V.A.N.I입니다, 당신의 뱅킹 어시스턴트.',
  es: '¡Hola! Soy V.A.N.I, tu asistente bancario.',
  fr: 'Bonjour! Je suis V.A.N.I, votre assistant bancaire.',
  de: 'Hallo! Ich bin V.A.N.I, Ihr Bankassistent.',
  ru: 'Привет! Я V.A.N.I, ваш банковский помощник.',
};

function useThreeBackground(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isDarkMode: boolean
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sep = 150;
    const axisX = 34;
    const axisY = 48;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const positions: number[] = [];
    const colors: number[] = [];
    const r = isDarkMode ? 0.18 : 0.01;
    const g = isDarkMode ? 0.42 : 0.03;
    const b = isDarkMode ? 0.82 : 0.10;

    for (let ix = 0; ix < axisX; ix += 1) {
      for (let iy = 0; iy < axisY; iy += 1) {
        positions.push(ix * sep - (axisX * sep) / 2, 0, iy * sep - (axisY * sep) / 2);
        colors.push(r, g, b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const pointSize = isDarkMode ? 6 : 5;
    const pointOpacity = isDarkMode ? 0.52 : 0.75;

    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      transparent: true,
      opacity: pointOpacity,
      sizeAttenuation: true,
    });

    scene.add(new THREE.Points(geometry, material));

    let count = 0;
    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);
      const positionArray = geometry.attributes.position.array as Float32Array;
      let index = 0;

      for (let ix = 0; ix < axisX; ix += 1) {
        for (let iy = 0; iy < axisY; iy += 1) {
          positionArray[index * 3 + 1] =
            Math.sin((ix + count) * 0.3) * 55 + Math.sin((iy + count) * 0.5) * 45;
          index += 1;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.07;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [canvasRef, isDarkMode]);
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLanguageSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const confirmationTimeoutRef = useRef<number | null>(null);
  const responseTimeoutRef = useRef<number | null>(null);
  const nextMessageIdRef = useRef<number>(0);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useThreeBackground(canvasRef, isDarkMode);

  const [showLoading, setShowLoading] = useState<boolean>(true);
  const [loadingExit, setLoadingExit] = useState<boolean>(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [recording, setRecording] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [welcomeMicActive, setWelcomeMicActive] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setLoadingExit(true), 900);
    const completeTimer = window.setTimeout(() => setShowLoading(false), 1400);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('vani-theme');
    const shouldUseLight = savedTheme === 'light';
    setIsDarkMode(!shouldUseLight);
    document.body.classList.toggle('light-mode', shouldUseLight);
    document.title = 'V.A.N.I — Customer Tablet';
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (confirmationTimeoutRef.current !== null) {
        window.clearTimeout(confirmationTimeoutRef.current);
      }
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleThemeToggle = () => {
    setIsDarkMode((previousMode) => {
      const nextIsDark = !previousMode;
      document.body.classList.toggle('light-mode', !nextIsDark);
      window.localStorage.setItem('vani-theme', nextIsDark ? 'dark' : 'light');
      return nextIsDark;
    });
  };

  const handleLanguageSelection = (code: string, name: string) => {
    if (confirmationTimeoutRef.current !== null) {
      window.clearTimeout(confirmationTimeoutRef.current);
    }

    setSelectedCode(code);
    setSelectedName(name);
    setScreen('confirming');

    confirmationTimeoutRef.current = window.setTimeout(() => {
      const greeting = GREETINGS[code] ?? GREETINGS.en;
      setMessages([{ id: 0, text: greeting, role: 'agent' }]);
      nextMessageIdRef.current = 1;
      setScreen('voice');
      // Dispatch language event so websocketService picks it up when mic is tapped
      window.dispatchEvent(new CustomEvent('vani:language-selected', {
        detail: { languageCode: code }
      }));
      onLanguageSelect(code, name);
    }, 1500);
  };

  const handleMicToggle = () => {
    if (recording) {
      setRecording(false);
      setInterimText('');

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setElapsed(0);
      vaniWS.stopRecording();
      return;
    }

    setRecording(true);
    setElapsed(0);
    setInterimText('');
    console.log('[VANI] Mic tapped — starting SpeechRecognition and WS');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedCode;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
        }

        if (finalTranscript) {
          setInterimText('');
          const trimmed = finalTranscript.trim();
          if (trimmed) {
            // Display immediately on the tablet UI
            setMessages((prev) => [
              ...prev,
              {
                id: nextMessageIdRef.current++,
                text: trimmed,
                role: 'user' as const,
              },
            ]);

            // Fire across WebSocket to the backend for Translator/Gemini processing
            if (vaniWS.ws?.readyState === WebSocket.OPEN) {
              vaniWS.ws.send(JSON.stringify({
                type: 'native_text',
                text: trimmed,
                // generate a fake timestamp just like the backend used to
                timestamp: new Date().toISOString()
              }));
              console.log(`[VANI] Sent final transcript chunk to backend: "${trimmed}"`);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[SpeechRecognition Error]:', event.error);
      };

      recognition.onend = () => {
        // If it stops but we are still recording (e.g. timeout), auto-restart it
        if (recording) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      console.warn("Speech recognition is not fully supported in this browser.");
      alert("Voice recognition is not supported in your browser. Please use Chrome.");
    }

    // Ignore backend transcript updates since the tablet UI renders them instantly 
    // from SpeechRecognition! (Pass B is completely ignored now on the tablet).
    vaniWS.onMessage = (msg) => {
      // Intentionally do nothing with `transcript_update`.
      // If we wanted to, we could show 'process_trigger' overlays here too.
    };

    vaniWS.connect().then(() => {
      console.log('[VANI] connect() resolved');
    });
    timerRef.current = window.setInterval(() => {
      setElapsed((seconds) => seconds + 1);
    }, 1000);
  };

  const handleWelcomeMicClick = () => {
    setWelcomeMicActive(true);
  };

  const handleReset = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current);
    }
    if (confirmationTimeoutRef.current !== null) {
      window.clearTimeout(confirmationTimeoutRef.current);
    }

    setRecording(false);
    setElapsed(0);
    setInterimText('');
    setMessages([]);
    nextMessageIdRef.current = 0;
    setSelectedCode('');
    setSelectedName('');
    setWelcomeMicActive(false);
    setScreen('welcome');
    vaniWS.onMessage = null;
    vaniWS.disconnect();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };
  const confirmationText =
    CONFIRMATION_MESSAGES[selectedCode] ?? 'Language selected. You may speak now.';

  return (
    <>
      <canvas ref={canvasRef} className="three-canvas" />
      <div className="glow-overlay" />

      {showLoading && (
        <div className={`loading-screen ${loadingExit ? 'is-exiting' : ''}`} aria-live="polite">
          <div className="loading-content">
            <h1 className="loading-logo">V.A.N.I</h1>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
              <div className="loading-spinner" aria-hidden="true" style={{ position: 'absolute', inset: 0 }} />
              <MicrophoneGlyph className="loading-mic-svg" />
            </div>
            <p className="loading-text">Initializing V.A.N.I...</p>
          </div>
        </div>
      )}

      <button
        type="button"
        className="theme-toggle-btn"
        onClick={handleThemeToggle}
        aria-label="Toggle theme"
      >
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {!showLoading && screen === 'welcome' && (
        <div className="welcome-container">
          <div>
            <h1 className="welcome-logo">V.A.N.I</h1>
            <p className="vani-tagline">Voice-powered AI for Natural Interaction</p>
          </div>

          <div className="welcome-callout">
            <VANIMic
              active={welcomeMicActive}
              onClick={handleWelcomeMicClick}
              size="large"
              ariaLabel="Tap to speak"
            />

            <div className="welcome-subtitles">
              <span>Please select your preferred language to begin</span>
            </div>
          </div>

          <div className="welcome-language-selector">
            <LanguageSelector onLanguageSelect={handleLanguageSelection} />
          </div>
        </div>
      )}

      {screen === 'confirming' && (
        <div className="confirmation-container" aria-live="polite">
          <VANIMic active={true} onClick={() => {}} size="large" ariaLabel="Microphone active" />

          <div className="confirmation-message script-native">{confirmationText}</div>

          <span className="confirm-lang-badge">{selectedName || selectedCode.toUpperCase()}</span>
        </div>
      )}

      {screen === 'voice' && (
        <div className="voice-screen">
          <div className="voice-header">
            <span className="voice-header-logo">V.A.N.I</span>
            <span className="voice-header-subtitle">Banking Assistant</span>
            <span className="lang-badge">{selectedCode.toUpperCase()}</span>
          </div>

          <div className="chat-area" ref={chatAreaRef}>
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble ${message.role} script-native`}>
                {message.text}
              </div>
            ))}
            {interimText && (
              <div className="chat-bubble user script-native interim-bubble">
                {interimText}
              </div>
            )}
          </div>

          <InlineVoiceInput
            recording={recording}
            elapsed={elapsed}
            onToggle={handleMicToggle}
          />

          <button className="reset-link" onClick={handleReset} aria-label="Change language">
            ← Change language
          </button>
        </div>
      )}
    </>
  );
};

export default WelcomeScreen;
