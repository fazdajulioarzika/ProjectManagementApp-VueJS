import api from "./api";

export default {
  search: (search) =>
    api.get("/users", { params: { search } }).then((r) => r.data.data.users),
  updateRole: (id, role) =>
    api.patch(`/users/${id}/role`, { role }).then((r) => r.data.data.user),
};
