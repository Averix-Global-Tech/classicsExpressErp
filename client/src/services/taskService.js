import api from './api';

const taskService = {
  async createTask(data) {
    const { data: res } = await api.post('/tasks', data);
    return res.data;
  },

  async createTodo(data) {
    const { data: res } = await api.post('/tasks/todos', data);
    return res.data;
  },

  async listTasks({ page = 1, limit = 20, status, priority, isPersonal, assignedTo } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (isPersonal !== undefined) params.isPersonal = isPersonal;
    if (assignedTo) params.assignedTo = assignedTo;
    const { data: res } = await api.get('/tasks', { params });
    return res.data;
  },

  async getOverdue() {
    const { data: res } = await api.get('/tasks/overdue');
    return res.data;
  },

  async getEmployeeSummary(userId) {
    const { data: res } = await api.get(`/tasks/employee/${userId}/summary`);
    return res.data;
  },

  async getTask(id) {
    const { data: res } = await api.get(`/tasks/${id}`);
    return res.data;
  },

  async updateTask(id, data) {
    const { data: res } = await api.patch(`/tasks/${id}`, data);
    return res.data;
  },

  async updateProgress(id, progress) {
    const { data: res } = await api.patch(`/tasks/${id}/progress`, { progress });
    return res.data;
  },

  async completeTask(id) {
    const { data: res } = await api.patch(`/tasks/${id}/complete`);
    return res.data;
  },

  async addNote(id, note) {
    const { data: res } = await api.post(`/tasks/${id}/notes`, { note });
    return res.data;
  },

  async deleteTask(id) {
    const { data: res } = await api.delete(`/tasks/${id}`);
    return res.data;
  },
};

export default taskService;
