import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  X,
  Bot,
  User as UserIcon
} from 'lucide-react';
import ConversationList from './ConversationList';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  isOpen,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
            display: 'block',
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '280px',
          height: '100%',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'transform var(--transition-normal)',
          position: window.innerWidth <= 768 ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          transform: window.innerWidth <= 768 && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          boxShadow: isOpen && window.innerWidth <= 768 ? 'var(--shadow-lg)' : 'none',
        }}
      >
        {/* Sidebar Header: Brand & New Chat */}
        <div style={{
          padding: '1.1rem 1rem 0.6rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem',
        }}>
          {/* Logo & Mobile Close */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: 'var(--shadow-glow)',
              }}>
                <Bot size={18} />
              </div>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}>
                Aether <span className="gradient-text">AI</span>
              </span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              style={{
                display: window.innerWidth <= 768 ? 'flex' : 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth <= 768) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.92'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>

          {/* Search Chats Input */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem 0.45rem 2rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <ConversationList
          conversations={filteredConversations}
          activeId={activeConversationId}
          onSelect={(id) => {
            onSelectConversation(id);
            if (window.innerWidth <= 768) onClose();
          }}
          onRename={onRenameConversation}
          onDelete={onDeleteConversation}
        />

        {/* Sidebar Footer */}
        <div style={{
          padding: '0.8rem 0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          background: 'var(--bg-sidebar)',
        }}>
          {/* Documents link */}
          <button
            onClick={() => {
              navigate('/documents');
              if (window.innerWidth <= 768) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: location.pathname === '/documents' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              color: location.pathname === '/documents' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.88rem',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
            onMouseLeave={(e) => {
              if (location.pathname !== '/documents') e.currentTarget.style.background = 'transparent';
            }}
          >
            <FileText size={17} color="var(--accent-primary)" />
            <span>Documents & RAG</span>
          </button>

          {/* Settings link */}
          <button
            onClick={() => {
              navigate('/settings');
              if (window.innerWidth <= 768) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: location.pathname === '/settings' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              color: location.pathname === '/settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.88rem',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
            onMouseLeave={(e) => {
              if (location.pathname !== '/settings') e.currentTarget.style.background = 'transparent';
            }}
          >
            <SettingsIcon size={17} color="var(--text-muted)" />
            <span>Settings</span>
          </button>

          {/* User Account & Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.75rem',
            marginTop: '0.3rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}>
                <UserIcon size={15} />
              </div>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user?.username || 'User'}
              </span>
            </div>

            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
