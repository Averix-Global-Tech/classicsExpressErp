import api from './api';

const productivityService = {
  async getStats() {
    const { data } = await api.get('/productivity/stats');
    return data.data;
  },
  async listAwb(params = {}) {
    const { data } = await api.get('/productivity/awb', { params });
    return data.data;
  },
  async listEmails(params = {}) {
    const { data } = await api.get('/productivity/emails', { params });
    return data.data;
  },
  async sendEmail(payload) {
    const { data } = await api.post('/productivity/emails', payload);
    return data.data;
  },
  async getActivityLog(params = {}) {
    const { data } = await api.get('/productivity/activity', { params });
    return data.data;
  },
};

export default productivityService;
