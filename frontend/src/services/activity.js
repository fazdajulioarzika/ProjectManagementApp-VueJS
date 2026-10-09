import api from "./api";

export default {
  listByProject: (projectId, page = 1) =>
    api
      .get(`/projects/${projectId}/activities`, { params: { page } })
      .then((r) => r.data.data),
};
