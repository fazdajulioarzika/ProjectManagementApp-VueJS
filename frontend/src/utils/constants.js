export const TASK_STATUS = {
  todo: { label: "Todo", class: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", class: "bg-blue-100 text-blue-700" },
  review: { label: "Review", class: "bg-amber-100 text-amber-700" },
  done: { label: "Done", class: "bg-green-100 text-green-700" },
};

export const TASK_PRIORITY = {
  low: { label: "Low", class: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", class: "bg-sky-100 text-sky-700" },
  high: { label: "High", class: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", class: "bg-red-100 text-red-700" },
};
export const PROJECT_STATUS = {
  planning: { label: "Planning", class: "bg-gray-100 text-gray-700" },
  active: { label: "Active", class: "bg-indigo-100 text-indigo-700" },
  completed: { label: "Completed", class: "bg-green-100 text-green-700" },
  archived: { label: "Archived", class: "bg-gray-200 text-gray-600" },
};

export const toOptions = (map) =>
  Object.entries(map).map(([value, v]) => ({ value, label: v.label }));
