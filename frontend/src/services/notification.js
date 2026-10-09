import api from "./api";

export default {
  list: () => api.get("/notifications").then((r) => r.data.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};
