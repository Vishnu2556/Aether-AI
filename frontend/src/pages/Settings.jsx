import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Cpu,
  ShieldCheck,
  Bot,
  Info,
  Menu
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { chatService } from '../services/chat';
import api from '../services/api';

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [historyLimit, setHistoryLimit] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convs, health] = await Promise.all([
          chatService.getConversations(),
          api.get('/health').then((r) => r.data).catch(() => null),
        ]);
        setConversations(convs);
        setHealthData(health);
      } catch (err) {
        console.error('Failed to load settings data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={(id) => navigate(`/?c=${id}`)}
        onNewChat={() => navigate('/')}
        onRenameConversation={() => {}}
        onDeleteConversation={() => {}}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <header style={{
          height: '56px',
          padding: '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: window.innerWidth <= 768 ? 'block' : 'none',
            }}
          >
            <Menu size={20} />
          </button>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Settings & Preferences
          </h2>
        </header>

        {/* Settings Form Container */}
        <div style={{
          maxWidth: '750px',
          width: '100%',
          margin: '0 auto',
          padding: '2.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}>
          {/* Section: Appearance */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Appearance
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Choose your preferred interface theme
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {[
                { id: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                { id: 'light', label: 'Light', icon: <Sun size={18} /> },
                { id: 'system', label: 'System', icon: <Monitor size={18} /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${theme === opt.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: theme === opt.id ? 'var(--accent-glow)' : 'var(--bg-app)',
                    color: theme === opt.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Section: AI Model Configuration */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Cpu size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                AI Model & LLM Provider
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Active backend provider details. Managed securely via server environment variables.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Configured Provider</span>
                <span style={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  background: 'var(--accent-glow)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {healthData?.llm_provider || 'ollama'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Ollama Local Model</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {healthData?.ollama_model || 'llama3.2'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>OpenAI Cloud Model</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {healthData?.openai_model || 'Not configured'}
                </span>
              </div>
            </div>
          </section>

          {/* Section: Chat Memory */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Conversation Context Window
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Maximum number of recent messages sent to the LLM for conversation continuity.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="range"
                min={4}
                max={50}
                step={2}
                value={historyLimit}
                onChange={(e) => setHistoryLimit(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{
                fontSize: '0.94rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                minWidth: '50px',
                textAlign: 'right',
              }}>
                {historyLimit} msgs
              </span>
            </div>
          </section>

          {/* Section: About */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <Bot size={22} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                About Aether <span className="gradient-text">AI</span>
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Aether AI is a production-grade conversational AI application built with FastAPI, SQLite, React, Vite, and custom RAG embedding engines. It supports seamless streaming, document grounded answers, and multi-provider LLM integrations.
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Version 1.0.0 • Built with excellence
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
