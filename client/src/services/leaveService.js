import api from './api';

const leaveService = {
  async getLeaveTypes(activeOnly = false) {
    const { data: res } = await api.get('/leave/types', { params: activeOnly ? { activeOnly: 'true' } : {} });
    return res.data;
  },

  async createLeaveType(data) {
    const { data: res } = await api.post('/leave/types', data);
    return res.data;
  },

  async updateLeaveType(id, data) {
    const { data: res } = await api.patch(`/leave/types/${id}`, data);
    return res.data;
  },

  async deleteLeaveType(id) {
    const { data: res } = await api.delete(`/leave/types/${id}`);
    return res.data;
  },

  async applyLeave(data) {
    const { data: res } = await api.post('/leave/applications', data);
    return res.data;
  },

  async getMyLeaves(status) {
    const params = {};
    if (status) params.status = status;
    const { data: res } = await api.get('/leave/applications/mine', { params });
    return res.data;
  },

  async getAllApplications({ page = 1, limit = 20, status, user, leaveType } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (user) params.user = user;
    if (leaveType) params.leaveType = leaveType;
    const { data: res } = await api.get('/leave/applications', { params });
    return res.data;
  },

  async getApplication(id) {
    const { data: res } = await api.get(`/leave/applications/${id}`);
    return res.data;
  },

  async reviewApplication(id, decision, reviewComment = '') {
    const { data: res } = await api.patch(`/leave/applications/${id}/review`, { decision, reviewComment });
    return res.data;
  },

  async cancelApplication(id) {
    const { data: res } = await api.patch(`/leave/applications/${id}/cancel`);
    return res.data;
  },

  async getBalance(year) {
    const { data: res } = await api.get('/leave/balance', { params: { year } });
    return res.data;
  },

  async getCalendar(from, to) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data: res } = await api.get('/leave/calendar', { params });
    return res.data;
  },

  async getReports(from, to) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data: res } = await api.get('/leave/reports', { params });
    return res.data;
  },
};

export default leaveService;
