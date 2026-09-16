import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export const LoadingIndicator = ({ statusText = "Aether AI is thinking..." }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.85rem',
      padding: '1rem 1.25rem',
      maxWidth: '850px',
      margin: '0 auto',
      width: '100%',
      animation: 'fadeIn 0.25s ease',
    }}>
      {/* Bot Avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        flexShrink: 0,
        boxShadow: 'var(--shadow-glow)',
      }}>
        <Bot size={20} />
      </div>

      {/* Typing Bubble */}
      <div style={{
        background: 'var(--bg-ai-msg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.75rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            animation: 'pulseGlow 1.2s infinite 0s',
          }} />
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            animation: 'pulseGlow 1.2s infinite 0.2s',
          }} />
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            animation: 'pulseGlow 1.2s infinite 0.4s',
          }} />
        </div>
        <span style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <Sparkles size={14} color="var(--accent-primary)" />
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
