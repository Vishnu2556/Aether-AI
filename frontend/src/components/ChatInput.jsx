import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, Image, BookOpen } from 'lucide-react';

export const ChatInput = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  useRag,
  setUseRag,
  onAttachClick,
  disabled = false
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '850px',
      margin: '0 auto',
      padding: '0 1rem 1.25rem',
      position: 'relative',
    }}>
      {/* Container Card */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        padding: '0.75rem 1rem 0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      >
        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Connecting..." : "Ask Aether AI anything..."}
          rows={1}
          disabled={disabled}
          style={{
            width: '100%',
            maxHeight: '200px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'none',
            lineHeight: 1.5,
          }}
        />

        {/* Toolbar & Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.25rem',
        }}>
          {/* Left Helpers: Document Attach & RAG indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setInput((current) => current.startsWith('/image ') ? current : `/image ${current}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.3rem 0.65rem',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              title="Generate an image from a prompt"
            >
              <Image size={14} />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={onAttachClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.3rem 0.65rem',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              title="Attach document for RAG analysis"
            >
              <Paperclip size={14} />
              <span>Attach File</span>
            </button>

            <button
              type="button"
              onClick={() => setUseRag(!useRag)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: useRag ? 'var(--accent-glow)' : 'transparent',
                border: `1px solid ${useRag ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-full)',
                padding: '0.3rem 0.65rem',
                color: useRag ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              title="Toggle Retrieval-Augmented Generation from uploaded documents"
            >
              <BookOpen size={14} />
              <span>RAG: {useRag ? 'Enabled' : 'Off'}</span>
            </button>
          </div>

          {/* Right Action: Send or Stop */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                  transition: 'transform var(--transition-fast)',
                }}
                title="Stop generation"
              >
                <Square size={14} fill="#ffffff" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!input.trim() || disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: input.trim() ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: input.trim() ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'all var(--transition-fast)',
                  boxShadow: input.trim() ? 'var(--shadow-glow)' : 'none',
                }}
                title="Send message (Enter)"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '0.45rem',
        fontSize: '0.74rem',
        color: 'var(--text-muted)',
      }}>
        Aether AI may provide inaccurate information. Verify important facts and citations.
      </div>
    </div>
  );
};

export default ChatInput;
