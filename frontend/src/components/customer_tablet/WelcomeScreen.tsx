// [Member 3 - Abhinav] frontend/src/components/customer_tablet/WelcomeScreen.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { LanguageSelector } from './LanguageSelector';
import { notifyWebSocket } from '../../services/apiService';

/* ================================================================
   TYPES
================================================================ */
type Screen = 'welcome' | 'confirming' | 'voice';

export interface WelcomeScreenProps {
  onLanguageSelect: (languageCode: string, languageName: string) => void;
}

interface ChatMessage {
  id: number;
  text: string;
  role: 'agent' | 'user';
}

function MicrophoneGlyph({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/* ================================================================
   LOCALISATION DATA
================================================================ */
const CONFIRMATION_MESSAGES: Record<string, string> = {
  en: 'Language selected. You may speak now.',
  hi: 'भाषा चुनी गई। अब आप बोल सकते हैं।',
  mr: 'भाषा निवडली. आता बोला.',
  ta: 'மொழி தேர்ந்தெடுக்கப்பட்டது. இப்போது பேசலாம்.',
  te: 'భాష ఎంచుకోబడింది. ఇప్పుడు మాట్లాడవచ్చు.',
  bn: 'ভাষা নির্বাচিত। এখন কথা বলুন।',
};

const GREETINGS: Record<string, string> = {
  en: "Hello! I'm V.A.N.I, your banking assistant. How can I help you today?",
  hi: 'नमस्ते! मैं V.A.N.I हूँ, आपकी बैंकिंग सहायक। आज मैं आपकी कैसे मदद कर सकती हूँ?',
  mr: 'नमस्कार! मी V.A.N.I आहे, तुमची बँकिंग सहाय्यक. आज मी तुम्हाला कशी मदत करू?',
  ta: 'வணக்கம்! நான் V.A.N.I, உங்கள் வங்கி உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவலாம்?',
  te: 'నమస్కారం! నేను V.A.N.I, మీ బ్యాంకింగ్ సహాయకుడు. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
  bn: 'নমস্কার! আমি V.A.N.I, আপনার ব্যাংকিং সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
};

/* ================================================================
   THREE.JS HOOK
================================================================ */
function useThreeBackground(canvasRef: React.RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const SEP = 150, AX = 34, AY = 48;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 355, 1220);

    const positions: number[] = [];
    const colors: number[] = [];

    for (let ix = 0; ix < AX; ix++) {
      for (let iy = 0; iy < AY; iy++) {
        positions.push(ix * SEP - (AX * SEP) / 2, 0, iy * SEP - (AY * SEP) / 2);
        colors.push(0.18, 0.42, 0.82);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 6,
      vertexColors: true,
      transparent: true,
      opacity: 0.52,
      sizeAttenuation: true,
    });

    scene.add(new THREE.Points(geo, mat));

    let count = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const pos = geo.attributes.position.array as Float32Array;
      let i = 0;
      for (let ix = 0; ix < AX; ix++) {
        for (let iy = 0; iy < AY; iy++) {
          pos[i * 3 + 1] =
            Math.sin((ix + count) * 0.3) * 55 + Math.sin((iy + count) * 0.5) * 45;
          i++;
        }
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.07;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [canvasRef]);
}

/* ================================================================
   VOICE VISUALIZER BARS
================================================================ */
const BAR_COUNT = 48;

function VoiceVisualizer({ active }: { active: boolean }): React.ReactElement {
  const [heights, setHeights] = useState<number[]>(new Array(BAR_COUNT).fill(4));
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      if (!active) return;
      setHeights(Array.from({ length: BAR_COUNT }, () => 10 + Math.random() * 90));
      frameRef.current = window.setTimeout(animate, 90);
    };

    if (active) {
      animate();
    } else {
      if (frameRef.current !== null) clearTimeout(frameRef.current);
      setHeights(new Array(BAR_COUNT).fill(4));
    }

    return () => {
      if (frameRef.current !== null) clearTimeout(frameRef.current);
    };
  }, [active]);

  return (
    <div className="visualizer">
      {heights.map((h, i) => (
        <div
          key={i}
          className="viz-bar"
          style={active ? { height: `${h}%`, background: `rgba(${Math.round(50 + h)}, ${Math.round(100 + h * 0.4)}, 255, 0.7)` } : undefined}
        />
      ))}
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLanguageSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useThreeBackground(canvasRef);

  const [showLoading, setShowLoading]   = useState<boolean>(true);
  const [loadingExit, setLoadingExit]   = useState<boolean>(false);
  const [welcomeMicActive, setWelcomeMicActive] = useState<boolean>(false);
  const [screen, setScreen]             = useState<Screen>('welcome');
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [msgCounter, setMsgCounter]     = useState<number>(0);
  const [recording, setRecording]       = useState<boolean>(false);
  const [elapsed, setElapsed]           = useState<number>(0);
  const chatAreaRef                     = useRef<HTMLDivElement>(null);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Scroll chat to bottom on new messages */
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  /* ---- Initial loading transition ---- */
  useEffect(() => {
    const exitTimer = window.setTimeout(() => setLoadingExit(true), 900);
    const completeTimer = window.setTimeout(() => setShowLoading(false), 1400);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  /* ---- Language chosen (from prime tiles OR modal) ---- */
  const handleLanguageSelection = (code: string, name: string) => {
    setSelectedCode(code);
    setSelectedName(name);
    setScreen('confirming');

    // After 1.5s of mic animation, transition to voice screen
    setTimeout(() => {
      const greeting = GREETINGS[code] ?? GREETINGS['en'];
      setMessages([{ id: 0, text: greeting, role: 'agent' }]);
      setMsgCounter(1);
      setScreen('voice');
      notifyWebSocket(code);
      onLanguageSelect(code, name);
    }, 1500);
  };

  /* ---- Mic toggle ---- */
  const addMessage = useCallback((text: string, role: 'agent' | 'user') => {
    setMsgCounter(prev => {
      const id = prev;
      setMessages(msgs => [...msgs, { id, text, role }]);
      return prev + 1;
    });
  }, []);

  const handleMicToggle = () => {
    if (recording) {
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (elapsed > 0) {
        addMessage('मुझे अपने खाते में मदद चाहिए।', 'user');
        setTimeout(() => {
          addMessage(
            'I can see your account balance is ₹24,580. Is there anything else you need?',
            'agent',
          );
        }, 1600);
      }
      setElapsed(0);
    } else {
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
  };

  const handleWelcomeMicClick = () => {
    setWelcomeMicActive(true);
    window.setTimeout(() => {
      setWelcomeMicActive(false);
    }, 2200);
  };

  /* ---- Reset ---- */
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setElapsed(0);
    setMessages([]);
    setSelectedCode('');
    setSelectedName('');
    setScreen('welcome');
  };

  /* ---- Helpers ---- */
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const confirmText = CONFIRMATION_MESSAGES[selectedCode] ?? 'Language selected. You may speak now.';

  /* ================================================================
     JSX
  ================================================================ */
  return (
    <>
      {/* Three.js canvas — always present behind everything */}
      <canvas ref={canvasRef} className="three-canvas" />
      <div className="glow-overlay" />

      {showLoading && (
        <div className={`loading-screen ${loadingExit ? 'is-exiting' : ''}`} aria-live="polite">
          <div className="loading-content">
            <h1 className="loading-logo">V.A.N.I</h1>
            <div className="loading-spinner" aria-hidden="true" />
            <p className="loading-text">Initializing V.A.N.I...</p>
          </div>
        </div>
      )}

      {/* --- SCREEN: WELCOME --- */}
      {!showLoading && screen === 'welcome' && (
        <div className="welcome-container">
          <div>
            <h1 className="welcome-logo">V.A.N.I</h1>
            <p className="vani-tagline">Voice-powered AI for Natural Interaction</p>
          </div>

          <div className="welcome-callout">
            <button
              type="button"
              className="welcome-mic-wrapper"
              aria-label="Decorative microphone"
              onClick={handleWelcomeMicClick}
            >
              {welcomeMicActive && <div className="sonar-ring welcome-sonar-ring sonar-ring-1" />}
              {welcomeMicActive && <div className="sonar-ring welcome-sonar-ring sonar-ring-2" />}
              {welcomeMicActive && <div className="sonar-ring welcome-sonar-ring sonar-ring-3" />}
              <div className="welcome-mic-icon">
                <MicrophoneGlyph className="mic-icon-svg" />
              </div>
            </button>

            <div className="welcome-subtitles">
              <span>Please select your preferred language to begin</span>
            </div>
          </div>

          <div className="welcome-language-selector">
            <LanguageSelector onLanguageSelect={handleLanguageSelection} />
          </div>
        </div>
      )}

      {/* --- SCREEN: CONFIRMING (Mic Ripple Animation) --- */}
      {screen === 'confirming' && (
        <div className="confirmation-container" aria-live="polite">
          {/* Mic icon with sonar ripple rings */}
          <div className="mic-confirm-wrapper">
            <div className="sonar-ring sonar-ring-1" />
            <div className="sonar-ring sonar-ring-2" />
            <div className="sonar-ring sonar-ring-3" />
            <div className="mic-confirm-icon" aria-label="Microphone active">
              <MicrophoneGlyph className="mic-icon-svg" />
            </div>
          </div>

          {/* Confirmation text in selected language */}
          <div className="confirmation-message script-native">
            {confirmText}
          </div>

          {/* Gold language badge */}
          <span className="confirm-lang-badge">
            {selectedName || selectedCode.toUpperCase()}
          </span>
        </div>
      )}

      {/* --- SCREEN: VOICE CHAT --- */}
      {screen === 'voice' && (
        <div className="voice-screen">
          {/* Header */}
          <div className="voice-header">
            <span className="voice-header-logo">V.A.N.I</span>
            <span className="voice-header-subtitle">Banking Assistant</span>
            <span className="lang-badge">{selectedCode.toUpperCase()}</span>
          </div>

          {/* Chat bubbles */}
          <div className="chat-area" ref={chatAreaRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble ${msg.role} script-native`}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Voice input panel */}
          <div className="voice-panel">
            <button
              className={`mic-btn ${recording ? 'active' : ''}`}
              onClick={handleMicToggle}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              aria-pressed={recording}
            >
              <MicrophoneGlyph className="mic-icon-svg" />
              <div className="mic-spinner-sq" aria-hidden="true" />
            </button>

            <span className={`voice-timer ${recording ? 'active' : ''}`}>{fmt(elapsed)}</span>

            <VoiceVisualizer active={recording} />

            <span className={`voice-hint ${recording ? 'active' : ''}`}>
              {recording ? 'Listening...' : 'Click to speak'}
            </span>
          </div>

          <button className="reset-link" onClick={handleReset} aria-label="Change language">
            ← Change language
          </button>
        </div>
      )}
    </>
  );
};

export default WelcomeScreen;
