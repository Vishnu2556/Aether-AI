import api from './api';

export const authService = {
  async register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password });
    return res.data;
  },

  async login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
