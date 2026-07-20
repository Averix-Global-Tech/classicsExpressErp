import api from './api';

const shipmentService = {
  getDashboardStats: async () => {
    const { data } = await api.get('/shipments/dashboard');
    return data.data;
  },

  getReports: async () => {
    const { data } = await api.get('/shipments/reports');
    return data.data;
  },

  getAllShipments: async (params) => {
    const { data } = await api.get('/shipments', { params });
    return data.data;
  },

  getDetails: async (id) => {
    const { data } = await api.get(`/shipments/${id}`);
    return data.data;
  },

  getShipmentByAwb: async (awbNumber) => {
    const { data } = await api.get(`/shipments/awb/${awbNumber}`);
    return data.data;
  },

  createShipment: async (payload) => {
    const { data } = await api.post('/shipments', payload);
    return data.data;
  },

  updateStatus: async (id, payload) => {
    const { data } = await api.patch(`/shipments/${id}/status`, payload);
    return data.data;
  },

  updateShipment: async (id, payload) => {
    const { data } = await api.put(`/shipments/${id}`, payload);
    return data.data;
  },

  deleteShipment: async (id) => {
    const { data } = await api.delete(`/shipments/${id}`);
    return data;
  },
};

export default shipmentService;
