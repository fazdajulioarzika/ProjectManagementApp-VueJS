export const idOf = (v) => String(v?._id ?? v);
export const sameId = (a, b) => idOf(a) === idOf(b);

export const isProjectMember = (project, user) =>
  user.role === "admin" ||
  sameId(project.owner, user._id) ||
  project.members.some((m) => sameId(m.user, user._id));

export const canManageProject = (project, user) =>
  user.role === "admin" ||
  sameId(project.owner, user._id) ||
  (user.role === "manager" && isProjectMember(project, user));
