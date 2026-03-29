import React, { useEffect, useState } from 'react';
import { vaniWS } from '../../services/websocketService';
import type {
  TranscriptLine,
  ProcessTrigger,
  SessionMeta,
  VANIMessage
} from '../../types/transcript';
import LiveTranscript from './LiveTranscript';
import ProcessGuidance from './ProcessGuidance';

const Dashboard: React.FC = () => {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [activeTrigger, setActiveTrigger] = useState<ProcessTrigger | null>(null);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);

  useEffect(() => {
    // Dashboard is receive-only — it listens for broadcasts but never sends audio
    vaniWS.connect(true);
    
    vaniWS.onMessage = (msg: VANIMessage) => {
      if (msg.type === 'transcript_update') {
        // Pass A sends originalText only (empty translatedText) for the customer tablet.
        // Dashboard only shows bubbles that have English translation (Pass B).
        if (msg.data.translatedText) {
          setTranscript(prev => [...prev, msg.data]);
        }
      } else if (msg.type === 'process_trigger') {
        setActiveTrigger(msg);
      } else if (msg.type === 'session_meta') {
        setSessionMeta(msg);
      } else if (msg.type === 'summary_ready') {
        console.log('Summary ready:', msg);
      }
    };

    return () => {
      vaniWS.onMessage = null;
      vaniWS.disconnect();
    };
  }, []);

  const requestSummary = () => {
    if (vaniWS.ws && vaniWS.ws.readyState === WebSocket.OPEN) {
      vaniWS.ws.send(JSON.stringify({ type: 'generate_summary' }));
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0F1923',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    overflow: 'hidden'
  };

  const topBarStyle: React.CSSProperties = {
    height: '60px',
    backgroundColor: '#1A2B3C',
    borderBottom: '1px solid #2D3748',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    color: '#FFFFFF',
    justifyContent: 'space-between',
    flexShrink: 0
  };

  const mainContentStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  };

  const leftColStyle: React.CSSProperties = {
    width: '70%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #2D3748'
  };

  const rightColStyle: React.CSSProperties = {
    width: '30%',
    display: 'flex',
    flexDirection: 'column'
  };

  const bottomBarStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: '#1A2B3C',
    borderTop: '1px solid #2D3748',
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0
  };

  const liveDotStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#F6AD55',
    marginRight: '12px',
    boxShadow: '0 0 8px #F6AD55',
    animation: 'livePulse 2s infinite'
  };

  const badgeStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginLeft: '12px'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          body { margin: 0; padding: 0; }
          * { box-sizing: border-box; }
          @keyframes livePulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>

      {/* Top Bar */}
      <div style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={liveDotStyle}></div>
          <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>V.A.N.I</span>
        </div>
        {sessionMeta && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: '#A0AEC0' }}>Session: {sessionMeta.sessionId}</span>
            <span style={badgeStyle}>LANG: {sessionMeta.detectedLang.toUpperCase()}</span>
            <span style={badgeStyle}>CONF: {Math.round(sessionMeta.confidenceScore * 100)}%</span>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div style={mainContentStyle}>
        <div style={leftColStyle}>
          <LiveTranscript lines={transcript} />
        </div>
        <div style={rightColStyle}>
          <ProcessGuidance trigger={activeTrigger} onDismiss={() => setActiveTrigger(null)} />
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={bottomBarStyle}>
        <button
          onClick={requestSummary}
          style={{
            backgroundColor: '#3182CE',
            color: '#FFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2B6CB0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3182CE'}
        >
          Generate Summary
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
