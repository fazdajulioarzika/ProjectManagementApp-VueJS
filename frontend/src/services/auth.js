import api from "./api";

export default {
  register: (payload) =>
    api.post("/auth/register", payload).then((r) => r.data.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data.data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me").then((r) => r.data.data.user),
};
