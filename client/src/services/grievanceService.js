import api from './api';

const grievanceService = {
  // Shared
  getDashboardStats: async () => {
    const { data } = await api.get('/grievances/dashboard');
    return data.data;
  },
  
  getDetails: async (id) => {
    const { data } = await api.get(`/grievances/${id}`);
    return data.data;
  },
  
  addReply: async (id, formData) => {
    const { data } = await api.post(`/grievances/${id}/reply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },

  submitFeedback: async (id, payload) => {
    const { data } = await api.patch(`/grievances/${id}/feedback`, payload);
    return data.data;
  },

  // Employee
  getMyGrievances: async () => {
    const { data } = await api.get('/grievances/my');
    return data.data;
  },

  createGrievance: async (formData) => {
    const { data } = await api.post('/grievances', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },

  // Admin
  getAllGrievances: async (params) => {
    const { data } = await api.get('/grievances', { params });
    return data.data;
  },

  updateStatus: async (id, payload) => {
    const { data } = await api.patch(`/grievances/${id}/status`, payload);
    return data.data;
  },

  assignGrievance: async (id, payload) => {
    const { data } = await api.patch(`/grievances/${id}/assign`, payload);
    return data.data;
  },

  // Settings (Admin)
  getSettings: async () => {
    const { data } = await api.get('/grievances/config/settings');
    return data.data;
  },

  updateSettings: async (payload) => {
    const { data } = await api.put('/grievances/config/settings', payload);
    return data.data;
  }
};

export default grievanceService;
