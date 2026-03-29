import React, { useEffect, useRef } from 'react';
import type { TranscriptLine } from '../../types/transcript';

interface LiveTranscriptProps {
  lines: TranscriptLine[];
}

const Bubble = React.memo(({ line }: { line: TranscriptLine }) => {
  const isCustomer = line.sender === 'customer';

  const alignStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: isCustomer ? 'flex-start' : 'flex-end',
    marginBottom: '16px',
    width: '100%',
  };

  const bubbleStyle: React.CSSProperties = {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: isCustomer ? 'rgba(93, 202, 165, 0.1)' : 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${isCustomer ? 'rgba(93, 202, 165, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
  };

  const senderStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: isCustomer ? '#5DCAA5' : '#E2E8F0',
    marginBottom: '4px',
    fontWeight: 'bold',
  };

  const originalStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    lineHeight: 1.6,
    color: '#FFFFFF',
    marginBottom: '6px',
    fontFamily: "'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Bengali', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Kannada', 'Noto Sans Malayalam', 'Noto Sans Gujarati', 'Noto Sans Gurmukhi', sans-serif",
  };

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '8px 0',
  };

  const translatedStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    lineHeight: 1.5,
    color: '#A0AEC0',
    fontStyle: 'italic',
  };

  const timestampStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: '#718096',
    marginTop: '8px',
    fontFamily: 'monospace',
    textAlign: isCustomer ? 'left' : 'right',
  };

  return (
    <div style={alignStyle}>
      <div style={bubbleStyle}>
        <div style={senderStyle}>{line.sender}</div>
        <div style={originalStyle}>{line.originalText}</div>
        <div style={dividerStyle}></div>
        <div style={translatedStyle}>{line.translatedText}</div>
        <div style={timestampStyle}>{new Date(line.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
});

Bubble.displayName = 'Bubble';

const LiveTranscript: React.FC<LiveTranscriptProps> = React.memo(({ lines }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [lines]);

  const containerStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#0F1923',
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  };

  const emptyStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#718096',
    fontStyle: 'italic',
    letterSpacing: '0.1em',
  };

  return (
    <div style={containerStyle} ref={containerRef} className="custom-scrollbar">
      <style>
        {`
          .dot-flashing {
            position: relative;
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background-color: #718096;
            color: #718096;
            animation: dot-flashing 1s infinite linear alternate;
            animation-delay: 0.5s;
            margin-left: 14px;
          }
          .dot-flashing::before, .dot-flashing::after {
            content: '';
            display: inline-block;
            position: absolute;
            top: 0;
          }
          .dot-flashing::before {
            left: -12px;
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background-color: #718096;
            color: #718096;
            animation: dot-flashing 1s infinite alternate;
            animation-delay: 0s;
          }
          .dot-flashing::after {
            left: 12px;
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background-color: #718096;
            color: #718096;
            animation: dot-flashing 1s infinite alternate;
            animation-delay: 1s;
          }
          @keyframes dot-flashing {
            0% { background-color: #718096; }
            50%, 100% { background-color: rgba(113, 128, 150, 0.2); }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #0F1923;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2D3748;
            border-radius: 3px;
          }
        `}
      </style>

      {lines.length === 0 ? (
        <div style={emptyStyle}>
          listening <div className="dot-flashing"></div>
        </div>
      ) : (
        lines.map(line => <Bubble key={line.id} line={line} />)
      )}
    </div>
  );
});

LiveTranscript.displayName = 'LiveTranscript';

export default LiveTranscript;
