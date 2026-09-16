import React, { useRef, useEffect, useState } from 'react';
import {
  Menu,
  Sparkles,
  Bot,
  ArrowDown,
  Cpu,
  FileSearch,
  Code,
  Briefcase,
  HelpCircle,
  Plus
} from 'lucide-react';
import Message from './Message';
import ChatInput from './ChatInput';
import LoadingIndicator from './LoadingIndicator';

export const ChatWindow = ({
  conversation,
  messages = [],
  streamingText = '',
  isStreaming = false,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onEditMessage,
  onOpenSidebar,
  onNewChat,
  onNavigateToDocs,
  useRag,
  setUseRag
}) => {
  const [input, setInput] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [messages, streamingText, isStreaming]);

  // Track scroll position to show/hide "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  const handleSend = () => {
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const starterPrompts = [
    {
      title: "Explain Machine Learning",
      subtitle: "in simple and intuitive words with examples",
      icon: <HelpCircle size={18} color="#6366f1" />,
      prompt: "Explain machine learning in simple and intuitive words with examples."
    },
    {
      title: "Write Python Code",
      subtitle: "FastAPI REST API with SQLite and Pydantic",
      icon: <Code size={18} color="#8b5cf6" />,
      prompt: "Write a complete FastAPI REST API example using SQLite and Pydantic schemas."
    },
    {
      title: "Analyze a Document",
      subtitle: "Ask questions from your uploaded PDF or notes",
      icon: <FileSearch size={18} color="#ec4899" />,
      prompt: "What information and key takeaways can you extract from my uploaded documents?"
    },
    {
      title: "Help Me Prepare for an Interview",
      subtitle: "System design & coding mock interview",
      icon: <Briefcase size={18} color="#10b981" />,
      prompt: "Help me prepare for a senior software engineering interview. Ask me realistic questions one by one."
    }
  ];

  return (
    <main style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-app)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        height: '56px',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        {/* Left: Mobile Menu & Conversation Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button
            onClick={onOpenSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Open navigation"
          >
            <Menu size={20} />
          </button>

          <h2 style={{
            fontSize: '0.98rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {conversation?.title || 'Aether AI'}
          </h2>
        </div>

        {/* Right: Badges & New Chat shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
          }}>
            <Cpu size={13} color="var(--accent-primary)" />
            <span>LLM Active</span>
          </div>

          <button
            onClick={onNewChat}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
            }}
            title="Start new chat"
          >
            <Plus size={14} />
            <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>New</span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          scrollBehavior: 'smooth',
        }}
      >
        {/* Empty State Screen */}
        {messages.length === 0 && !streamingText && (
          <div style={{
            margin: 'auto',
            maxWidth: '760px',
            width: '100%',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            animation: 'fadeIn 0.4s ease',
          }}>
            {/* Hero Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)',
              marginBottom: '1.25rem',
            }}>
              <Bot size={34} />
            </div>

            <h1 style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '0.4rem',
              color: 'var(--text-primary)',
            }}>
              Aether <span className="gradient-text">AI</span>
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              marginBottom: '2.2rem',
              maxWidth: '480px',
            }}>
              How can I help you today? Ask questions, write code, or explore your uploaded documents with RAG.
            </p>

            {/* Prompt Starter Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.85rem',
              width: '100%',
            }}>
              {starterPrompts.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInput(card.prompt);
                    onSendMessage(card.prompt);
                  }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {card.icon}
                    <span style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      {card.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {card.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Feed */}
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            onRegenerate={onRegenerate}
            onEdit={onEditMessage}
          />
        ))}

        {/* Streaming In-Progress Message */}
        {streamingText && (
          <Message
            message={{
              id: 'streaming-assistant',
              role: 'assistant',
              content: streamingText,
            }}
            isStreaming={true}
          />
        )}

        {/* Loading Indicator when starting generation before first token */}
        {isStreaming && !streamingText && (
          <LoadingIndicator statusText="Aether AI is generating..." />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          style={{
            position: 'absolute',
            bottom: '95px',
            right: '25px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            zIndex: 20,
          }}
          title="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Bottom Chat Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onStop={onStopStreaming}
        isStreaming={isStreaming}
        useRag={useRag}
        setUseRag={setUseRag}
        onAttachClick={onNavigateToDocs}
      />
    </main>
  );
};

export default ChatWindow;
