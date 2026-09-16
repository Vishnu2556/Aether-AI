import api from './api';

export const documentsService = {
  async listDocuments() {
    const res = await api.get('/documents');
    return res.data;
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async deleteDocument(id) {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
};
