import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  Menu,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Clock,
  HardDrive
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DocumentUpload from '../components/DocumentUpload';
import { documentsService } from '../services/documents';
import { chatService } from '../services/chat';

export const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, convs] = await Promise.all([
        documentsService.listDocuments(),
        chatService.getConversations(),
      ]);
      setDocuments(docs);
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Could not load documents from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSuccess = async (file) => {
    await documentsService.uploadDocument(file);
    await loadData();
  };

  const handleDelete = async (docId, filename) => {
    if (window.confirm(`Delete "${filename}" and all its indexed embeddings?`)) {
      try {
        await documentsService.deleteDocument(docId);
        setDocuments(documents.filter((d) => d.id !== docId));
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
            Knowledge Documents & RAG
          </h2>
        </header>

        {/* Content */}
        <div style={{
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Header Description */}
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              My Knowledge Documents
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Upload your PDFs, Word documents, and text files. Aether AI will automatically extract text, split it into chunks, generate embeddings, and ground answers using your private knowledge base.
            </p>
          </div>

          {/* Upload Zone */}
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />

          {/* Documents Table / List */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              padding: '0.9rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                Uploaded Documents ({documents.length})
              </span>

              {documents.length > 0 && (
                <button
                  onClick={() => navigate('/')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.35rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={14} />
                  <span>Chat With Documents</span>
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={40} style={{ opacity: 0.4, marginBottom: '0.6rem' }} />
                <p>No documents uploaded yet. Upload your first document above to start RAG!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-glow)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <FileText size={18} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {doc.filename}
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.15rem',
                        }}>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{doc.chunk_count || 0} chunks indexed</span>
                          <span>•</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        background: doc.status === 'ready' ? 'var(--success-bg)' : 'var(--warning)',
                        color: doc.status === 'ready' ? 'var(--success)' : '#ffffff',
                      }}>
                        {doc.status}
                      </span>

                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documents;
