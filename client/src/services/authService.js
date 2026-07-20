import api from './api';

// Thin wrappers over the auth endpoints. Each returns the backend `data` object
// and re-throws the normalised error on failure.
export const authService = {
  async login({ email, password, rememberMe }) {
    const { data } = await api.post('/auth/login', { email, password, rememberMe });
    return data.data;
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
  async logout() {
    const { data } = await api.post('/auth/logout');
    return data.data;
  },
  async refresh() {
    const { data } = await api.post('/auth/refresh');
    return data.data;
  },
  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data.data;
  },
  async resetPassword({ token, password }) {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data.data;
  },
  async changePassword({ currentPassword, password }) {
    const { data } = await api.post('/auth/change-password', { currentPassword, password });
    return data.data;
  },
};

export default authService;
