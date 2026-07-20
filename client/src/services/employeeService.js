import api from './api';

/**
 * Employee API service — thin wrappers over /api/employees endpoints.
 */
const employeeService = {
  /** Create a new employee (admin auto-generates password & sends email). */
  async create(data) {
    const { data: res } = await api.post('/employees', data);
    return res.data;
  },

  /** Paginated list with optional search / filters. */
  async list({ page = 1, limit = 20, search = '', role = '', department = '', isActive = '' } = {}) {
    const params = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;
    if (department) params.department = department;
    if (isActive !== '') params.isActive = isActive;
    const { data: res } = await api.get('/employees', { params });
    return res.data;
  },

  /** Get a single employee by MongoDB _id. */
  async get(id) {
    const { data: res } = await api.get(`/employees/${id}`);
    return res.data;
  },

  /** Update employee profile fields. */
  async update(id, data) {
    const { data: res } = await api.patch(`/employees/${id}`, data);
    return res.data;
  },

  /** Soft-deactivate employee. */
  async deactivate(id) {
    const { data: res } = await api.delete(`/employees/${id}`);
    return res.data;
  },

  /** Resend welcome email with a new temporary password. */
  async resendEmail(id) {
    const { data: res } = await api.post(`/employees/${id}/resend-email`);
    return res.data;
  },
};

export default employeeService;
