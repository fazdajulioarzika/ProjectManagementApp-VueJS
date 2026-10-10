export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const startOfTodayUTC = () =>
  new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

export const isOverdue = (task) =>
  !!task.dueDate &&
  task.status !== "done" &&
  new Date(task.dueDate) < startOfTodayUTC();

// ISO string -> "YYYY-MM-DD" untuk <input type="date">
export const toDateInput = (date) => (date ? String(date).slice(0, 10) : "");

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(date);
}
