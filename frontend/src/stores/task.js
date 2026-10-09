import { defineStore } from "pinia";
import { ref, computed } from "vue";
import taskService from "@/services/task";

export const useTaskStore = defineStore("task", () => {
  const tasks = ref([]);
  const loading = ref(false);

  const stats = computed(() => {
    const total = tasks.value.length;
    const done = tasks.value.filter((t) => t.status === "done").length;
    return {
      total,
      done,
      progress: total ? Math.round((done / total) * 100) : 0,
    };
  });

  async function fetchByProject(projectId) {
    loading.value = true;
    try {
      tasks.value = await taskService.listByProject(projectId);
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    tasks.value = [];
  }

  async function create(projectId, payload) {
    const task = await taskService.create(projectId, payload);
    tasks.value = [task, ...tasks.value];
    return task;
  }

  async function update(id, payload) {
    const task = await taskService.update(id, payload);
    tasks.value = tasks.value.map((t) => (t._id === id ? task : t));
    return task;
  }

  // Optimistic update: UI langsung berubah, dikembalikan jika request gagal
  async function updateStatus(id, status) {
    const previous = tasks.value;
    tasks.value = previous.map((t) => (t._id === id ? { ...t, status } : t));
    try {
      const task = await taskService.updateStatus(id, status);
      tasks.value = tasks.value.map((t) => (t._id === id ? task : t));
    } catch (e) {
      tasks.value = previous;
      throw e;
    }
  }

  async function remove(id) {
    await taskService.remove(id);
    tasks.value = tasks.value.filter((t) => t._id !== id);
  }

  return {
    tasks,
    loading,
    stats,
    fetchByProject,
    reset,
    create,
    update,
    updateStatus,
    remove,
  };
});
