import api from "./api";

export default {
  get: () => api.get("/dashboard").then((r) => r.data.data),
};
