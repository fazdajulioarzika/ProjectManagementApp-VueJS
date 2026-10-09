import api from "./api";

export default {
  list: () => api.get("/projects").then((r) => r.data.data.projects),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data.data.project),
  create: (payload) =>
    api.post("/projects", payload).then((r) => r.data.data.project),
  update: (id, payload) =>
    api.put(`/projects/${id}`, payload).then((r) => r.data.data.project),
  remove: (id) => api.delete(`/projects/${id}`),
  addMember: (id, payload) => api.post(`/projects/${id}/members`, payload),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};
