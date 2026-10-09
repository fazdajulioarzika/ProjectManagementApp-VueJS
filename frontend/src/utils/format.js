export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

export const isOverdue = (task) =>
  !!task.dueDate &&
  task.status !== "done" &&
  new Date(task.dueDate) < new Date();

// ISO string -> "YYYY-MM-DD" untuk <input type="date">
export const toDateInput = (date) => (date ? String(date).slice(0, 10) : "");
