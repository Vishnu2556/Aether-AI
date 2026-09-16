import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

export const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const cleanLang = (language || 'text').toLowerCase();

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      margin: '0.9rem 0',
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-code)',
    }}>
      {/* Code Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.45rem 0.9rem',
        background: 'rgba(0, 0, 0, 0.35)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', textTransform: 'lowercase' }}>
          {cleanLang}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'transparent',
            border: 'none',
            color: copied ? 'var(--success)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            padding: '0.2rem 0.4rem',
            borderRadius: 'var(--radius-sm)',
            transition: 'color var(--transition-fast)',
          }}
          title="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>

      {/* Code Body */}
      <div style={{ margin: 0, fontSize: '0.88rem' }}>
        <SyntaxHighlighter
          language={cleanLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.5,
          }}
          wrapLongLines={true}
        >
          {String(value).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
