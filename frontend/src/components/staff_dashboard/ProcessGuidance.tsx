import React, { useEffect, useState } from 'react';
import type { ProcessTrigger } from '../../types/transcript';

interface ProcessGuidanceProps {
  trigger: ProcessTrigger | null;
  onDismiss: () => void;
}

const ProcessGuidance: React.FC<ProcessGuidanceProps> = ({ trigger, onDismiss }) => {
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!trigger) {
      setCheckedDocs({});
    }
  }, [trigger]);

  const toggleDoc = (index: number) => {
    setCheckedDocs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const containerStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#1A2B3C',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    borderLeft: '1px solid #2D3748',
  };

  const idleStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4A5568',
    padding: '32px',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes slideInFade {
            from {
              opacity: 0;
              transform: translateX(40px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .guidance--active {
            animation: slideInFade 0.4s ease-out forwards;
            padding: 24px;
            height: 100%;
            overflow-y: auto;
          }
        `}
      </style>

      {!trigger ? (
        <div style={idleStyle}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
          <div>Listening for banking intent...</div>
        </div>
      ) : (
        <div className="guidance--active">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#FFFFFF' }}>{trigger.title}</h2>
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: '#A0AEC0',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '4px 8px',
              }}
            >
              ✕ Clear
            </button>
          </div>

          {trigger.steps && trigger.steps.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#48BB78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Process Steps
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trigger.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(72, 187, 120, 0.2)',
                      color: '#48BB78',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#E2E8F0', lineHeight: 1.4, paddingTop: '2px' }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trigger.requiredDocs && trigger.requiredDocs.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.875rem', color: '#F6AD55', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Required Documents
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(246, 173, 85, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(246, 173, 85, 0.2)' }}>
                {trigger.requiredDocs.map((doc, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!checkedDocs[idx]}
                      onChange={() => toggleDoc(idx)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#F6AD55'
                      }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      color: checkedDocs[idx] ? '#718096' : '#E2E8F0',
                      textDecoration: checkedDocs[idx] ? 'line-through' : 'none',
                      transition: 'all 0.2s'
                    }}>
                      {doc}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessGuidance;
