import { ref, computed } from "vue";

const empty = () => ({ search: "", status: "", priority: "", assignee: "" });

export function useTaskFilters(tasks) {
  const filters = ref(empty());

  const filtered = computed(() => {
    const { search, status, priority, assignee } = filters.value;
    const q = search.trim().toLowerCase();

    return tasks.value.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (status && t.status !== status) return false;
      if (priority && t.priority !== priority) return false;
      if (assignee === "none" && t.assignee) return false;
      if (assignee && assignee !== "none" && t.assignee?._id !== assignee)
        return false;
      return true;
    });
  });

  const active = computed(() => Object.values(filters.value).some(Boolean));
  const reset = () => (filters.value = empty());

  return { filters, filtered, active, reset };
}
