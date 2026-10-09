import api from "./api";

export default {
  search: (search) =>
    api.get("/users", { params: { search } }).then((r) => r.data.data.users),
};
