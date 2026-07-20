import api from './api';

const attendanceService = {
  // Employee
  checkIn: async () => {
    const { data } = await api.post('/attendance/check-in');
    return data.data;
  },
  
  checkOut: async () => {
    const { data } = await api.post('/attendance/check-out');
    return data.data;
  },
  
  getMyAttendance: async (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const { data } = await api.get(`/attendance/my-attendance?${params.toString()}`);
    return data.data;
  },

  // Admin
  getPendingApprovals: async () => {
    const { data } = await api.get('/attendance/pending');
    return data.data;
  },

  approveCheckIn: async (id) => {
    const { data } = await api.patch(`/attendance/${id}/approve-check-in`);
    return data.data;
  },

  approveCheckOut: async (id) => {
    const { data } = await api.patch(`/attendance/${id}/approve-check-out`);
    return data.data;
  },

  rejectRequest: async (id, reason) => {
    const { data } = await api.patch(`/attendance/${id}/reject`, { reason });
    return data.data;
  },

  getAdminDashboard: async () => {
    const { data } = await api.get('/attendance/dashboard');
    return data.data;
  },

  listAllAttendance: async (params) => {
    const { data } = await api.get('/attendance', { params });
    return data.data;
  },

  manualUpdate: async (id, payload) => {
    const { data } = await api.put(`/attendance/${id}/manual`, payload);
    return data.data;
  },

  getSettings: async () => {
    const { data } = await api.get('/attendance/settings');
    return data.data;
  },

  updateSettings: async (payload) => {
    const { data } = await api.put('/attendance/settings', payload);
    return data.data;
  }
};

export default attendanceService;
