import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const DocumentUpload = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.json', '.csv'];

  const validateAndUpload = async (file) => {
    setError('');
    setSuccess('');

    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file type. Please upload: ${allowedExtensions.join(', ')}`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setUploading(true);
    try {
      await onUploadSuccess(file);
      setSuccess(`"${file.name}" uploaded and indexed into RAG successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to upload document.';
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div style={{ width: '100%', marginBottom: '1.5rem' }}>
      {/* Drag & Drop Card */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: isDragging ? 'var(--accent-glow)' : 'var(--bg-surface)',
          transition: 'all var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,.json,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--accent-glow)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {uploading ? (
            <Loader2 size={26} className="animate-spin" />
          ) : (
            <UploadCloud size={28} />
          )}
        </div>

        <div>
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {uploading ? 'Processing & Indexing Embeddings...' : 'Click or drag document to upload'}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Supports PDF, DOCX, TXT, MD (Max 25MB)
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          marginTop: '0.85rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.86rem',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div style={{
          marginTop: '0.85rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--success-bg)',
          color: 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.86rem',
        }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
