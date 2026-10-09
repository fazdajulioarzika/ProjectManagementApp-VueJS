// Tujuan saat notifikasi diklik
export function notificationLink(n) {
  if (n.task && n.project) {
    return {
      name: "project-tasks",
      params: { id: n.project },
      query: { task: n.task },
    };
  }
  return { name: "tasks" };
}
