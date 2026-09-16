import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';

export const ConversationList = ({
  conversations = [],
  activeId,
  onSelect,
  onRename,
  onDelete
}) => {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const menuRef = useRef(null);

  // Close 3-dot dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group conversations into Today, Yesterday, Previous 7 Days, Older
  const groupConversations = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    conversations.forEach((conv) => {
      const convDate = new Date(conv.updated_at || conv.created_at).getTime();
      if (convDate >= today) {
        groups.Today.push(conv);
      } else if (convDate >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  const groups = groupConversations();

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (convId, e) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      onDelete(convId);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '0 0.5rem',
      overflowY: 'auto',
      flex: 1,
    }}>
      {Object.entries(groups).map(([label, items]) => {
        if (items.length === 0) return null;

        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {/* Group Label */}
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              padding: '0.4rem 0.6rem 0.2rem',
            }}>
              {label}
            </span>

            {/* Conversation Items */}
            {items.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditingThis = editingId === conv.id;
              const isMenuOpen = menuOpenId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => !isEditingThis && onSelect(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-subtle)' : 'transparent'}`,
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Left content */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    <MessageSquare size={16} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    
                    {isEditingThis ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 1 }}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id, e);
                            if (e.key === 'Escape') handleCancelRename(e);
                          }}
                          style={{
                            flex: 1,
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-focus)',
                            color: 'var(--text-primary)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.84rem',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '0.88rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {conv.title}
                      </span>
                    )}
                  </div>

                  {/* Right 3-dot menu */}
                  {!isEditingThis && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : conv.id);
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
                          opacity: isActive || isMenuOpen ? 1 : 0.6,
                        }}
                        title="Conversation options"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            zIndex: 100,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '0.35rem',
                            minWidth: '130px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                          }}
                        >
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.4rem 0.6rem',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Edit2 size={13} />
                            <span>Rename</span>
                          </button>

                          <button
                            onClick={(e) => handleDelete(conv.id, e)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.4rem 0.6rem',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--danger)',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {conversations.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}>
          No conversations yet. Start a new chat!
        </div>
      )}
    </div>
  );
};

export default ConversationList;
