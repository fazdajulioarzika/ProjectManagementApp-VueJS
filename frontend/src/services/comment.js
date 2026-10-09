import api from "./api";

export default {
  list: (taskId) =>
    api.get(`/tasks/${taskId}/comments`).then((r) => r.data.data.comments),
  create: (taskId, content) =>
    api
      .post(`/tasks/${taskId}/comments`, { content })
      .then((r) => r.data.data.comment),
  update: (id, content) =>
    api.put(`/comments/${id}`, { content }).then((r) => r.data.data.comment),
  remove: (id) => api.delete(`/comments/${id}`),
};
