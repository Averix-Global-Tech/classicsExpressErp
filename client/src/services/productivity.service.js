import api from './api';

const PRODUCTIVITY_URL = '/productivity';

const productivityService = {
  // My Productivity
  getMyAwbEntries: async (params) => {
    const response = await api.get(`${PRODUCTIVITY_URL}/my/awb`, { params });
    return response.data;
  },
  createAwbEntry: async (data) => {
    const response = await api.post(`${PRODUCTIVITY_URL}/my/awb`, data);
    return response.data;
  },
  updateAwbEntry: async (id, data) => {
    const response = await api.patch(`${PRODUCTIVITY_URL}/my/awb/${id}`, data);
    return response.data;
  },
  deleteAwbEntry: async (id) => {
    const response = await api.delete(`${PRODUCTIVITY_URL}/my/awb/${id}`);
    return response.data;
  },

  getMyEmailResolutions: async (params) => {
    const response = await api.get(`${PRODUCTIVITY_URL}/my/email`, { params });
    return response.data;
  },
  createEmailResolution: async (data) => {
    const response = await api.post(`${PRODUCTIVITY_URL}/my/email`, data);
    return response.data;
  },
  updateEmailResolution: async (id, data) => {
    const response = await api.patch(`${PRODUCTIVITY_URL}/my/email/${id}`, data);
    return response.data;
  },
  deleteEmailResolution: async (id) => {
    const response = await api.delete(`${PRODUCTIVITY_URL}/my/email/${id}`);
    return response.data;
  },

  getMyStats: async () => {
    const response = await api.get(`${PRODUCTIVITY_URL}/my/stats`);
    return response.data;
  },

  // Admin Productivity
  getAdminProductivityList: async (params) => {
    const response = await api.get(`${PRODUCTIVITY_URL}/admin`, { params });
    return response.data;
  },
  getAdminEmployeeProductivityDetail: async (id) => {
    const response = await api.get(`${PRODUCTIVITY_URL}/admin/${id}`);
    return response.data;
  }
};

export default productivityService;
