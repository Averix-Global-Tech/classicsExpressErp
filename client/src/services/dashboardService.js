import api from './api';

export const dashboardService = {
  async getSummary() {
    const { data } = await api.get('/dashboard/summary');
    return data.data;
  },
};

export default dashboardService;
