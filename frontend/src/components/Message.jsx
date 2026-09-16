import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User as UserIcon, Copy, Check, RotateCcw, Edit3, X, Save } from 'lucide-react';
import CodeBlock from './CodeBlock';

export const Message = ({
  message,
  onRegenerate,
  onEdit,
  isStreaming = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1.1rem 1.25rem',
        width: '100%',
        maxWidth: '850px',
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        transition: 'background-color var(--transition-fast)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.9rem',
        width: '100%',
      }}>
        {/* Avatar */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: isUser ? 'var(--bg-surface-hover)' : 'var(--accent-gradient)',
          border: isUser ? '1px solid var(--border-subtle)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isUser ? 'var(--text-primary)' : '#ffffff',
          flexShrink: 0,
          boxShadow: isUser ? 'none' : 'var(--shadow-glow)',
        }}>
          {isUser ? <UserIcon size={18} /> : <Bot size={20} />}
        </div>

        {/* Message Container */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header (Sender name & timestamp) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.35rem',
          }}>
            <span style={{
              fontWeight: 600,
              fontSize: '0.92rem',
              color: 'var(--text-primary)',
            }}>
              {isUser ? 'You' : 'Aether AI'}
            </span>

            {/* Top right quick actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: 0.85,
            }}>
              {isUser && !isEditing && (
                <button
                  onClick={() => {
                    setEditContent(message.content);
                    setIsEditing(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.78rem',
                  }}
                  title="Edit message"
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Content or Edit mode */}
          {isEditing ? (
            <div style={{
              marginTop: '0.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-focus)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.94rem',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                  }}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                  }}
                >
                  <Save size={14} /> Save & Resend
                </button>
              </div>
            </div>
          ) : (
            <div className="markdown-content" style={{
              lineHeight: 1.65,
              wordBreak: 'break-word',
            }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, '')}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Bottom Actions for AI Message */}
          {!isUser && !isStreaming && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginTop: '0.65rem',
              paddingTop: '0.35rem',
            }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'transparent',
                  border: 'none',
                  color: copied ? 'var(--success)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'color var(--transition-fast)',
                }}
                title="Copy response"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    padding: '0.2rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'color var(--transition-fast)',
                  }}
                  title="Regenerate response"
                >
                  <RotateCcw size={14} />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
