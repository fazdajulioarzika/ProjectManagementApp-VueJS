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
