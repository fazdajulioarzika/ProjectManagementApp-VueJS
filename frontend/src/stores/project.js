import { defineStore } from "pinia";
import { ref, computed } from "vue";
import projectService from "@/services/project";
import { useAuthStore } from "./auth";

export const useProjectStore = defineStore("project", () => {
  const projects = ref([]);
  const current = ref(null);
  const loading = ref(false);

  // Cerminan aturan di backend (canManageProject). Backend tetap yang menentukan.
  const canManage = computed(() => {
    const p = current.value;
    const u = useAuthStore().user;
    if (!p || !u) return false;
    if (u.role === "admin") return true;
    if (p.owner?._id === u._id) return true;
    return u.role === "manager" && p.members.some((m) => m.user?._id === u._id);
  });

  async function fetchAll() {
    loading.value = true;
    try {
      projects.value = await projectService.list();
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id) {
    current.value = await projectService.get(id);
  }

  async function create(payload) {
    return projectService.create(payload);
  }

  async function update(id, payload) {
    await projectService.update(id, payload);
    // response update tidak mem-populate owner/members, jadi ambil ulang
    current.value = await projectService.get(id);
    return current.value;
  }

  async function remove(id) {
    await projectService.remove(id);
    projects.value = projects.value.filter((p) => p._id !== id);
    current.value = null;
  }

  async function addMember(id, payload) {
    await projectService.addMember(id, payload);
    current.value = await projectService.get(id);
  }

  async function removeMember(id, userId) {
    await projectService.removeMember(id, userId);
    current.value = await projectService.get(id);
  }

  return {
    projects,
    current,
    loading,
    canManage,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    addMember,
    removeMember,
  };
});
