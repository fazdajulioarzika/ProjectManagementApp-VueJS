import api from "./api";

export default {
  listByProject: (projectId, params) =>
    api
      .get(`/projects/${projectId}/tasks`, { params })
      .then((r) => r.data.data.tasks),
  create: (projectId, payload) =>
    api
      .post(`/projects/${projectId}/tasks`, payload)
      .then((r) => r.data.data.task),
  update: (id, payload) =>
    api.put(`/tasks/${id}`, payload).then((r) => r.data.data.task),
  updateStatus: (id, status) =>
    api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data.data.task),
  remove: (id) => api.delete(`/tasks/${id}`),
  listAll: () => api.get("/tasks").then((r) => r.data.data.tasks),
};
