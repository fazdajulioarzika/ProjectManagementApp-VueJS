import api from "./api";

export default {
  get: (params) => api.get("/analytics", { params }).then((r) => r.data.data),
};
