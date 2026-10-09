<script setup>
import { ref, computed, watch, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-vue-next";
import { useProjectStore } from "@/stores/project";
import { useTaskStore } from "@/stores/task";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import BaseButton from "@/components/ui/BaseButton.vue";
import ProjectStatusBadge from "@/components/project/ProjectStatusBadge.vue";
import ProjectFormModal from "@/components/project/ProjectFormModal.vue";
import TaskFormModal from "@/components/task/TaskFormModal.vue";

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const auth = useAuthStore();
const toast = useToast();

const loading = ref(true);
const error = ref("");
const editOpen = ref(false);
const taskModal = ref({ open: false, task: null });

const tabs = [
  { label: "Overview", name: "project-overview" },
  { label: "Board", name: "project-board" },
  { label: "Tasks", name: "project-tasks" },
  { label: "Members", name: "project-members" },
  { label: "Activity", name: "project-activity" },
];

// Daftar anggota project, dipakai untuk pilihan assignee
const members = computed(() =>
  (projectStore.current?.members ?? []).map((m) => m.user).filter(Boolean)
);

// Dipakai tab Board dan Tasks untuk membuka modal task
provide("taskModal", {
  openCreate: () => (taskModal.value = { open: true, task: null }),
  openEdit: (task) => (taskModal.value = { open: true, task }),
});
// Membuka modal task jika URL membawa ?task=<id> (dari notifikasi / halaman Tasks)
function openTaskFromQuery() {
  const id = route.query.task;
  if (!id) return;
  const task = taskStore.tasks.find((t) => t._id === id);
  if (task) taskModal.value = { open: true, task };
  router.replace({ query: { ...route.query, task: undefined } });
}

watch(
  () => route.query.task,
  () => {
    if (!loading.value) openTaskFromQuery();
  }
);

async function load(id) {
  loading.value = true;
  error.value = "";
  projectStore.current = null;
  taskStore.reset();
  try {
    await Promise.all([
      projectStore.fetchOne(id),
      taskStore.fetchByProject(id),
    ]);
    openTaskFromQuery();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  (id) => id && load(id),
  { immediate: true }
);

async function removeProject() {
  if (!confirm("Hapus project ini beserta semua task di dalamnya?")) return;
  try {
    await projectStore.remove(route.params.id);
    toast.success("Project dihapus");
    router.push({ name: "projects" });
  } catch (e) {
    toast.error(e.message);
  }
}
</script>

<template>
  <p v-if="loading" class="text-gray-500">Memuat project...</p>

  <div v-else-if="error" class="space-y-3">
    <p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ error }}
    </p>
    <RouterLink to="/projects" class="text-sm text-indigo-600 hover:underline"
      >Kembali ke Projects</RouterLink
    >
  </div>

  <div v-else-if="projectStore.current" class="space-y-6">
    <div>
      <RouterLink
        to="/projects"
        class="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft class="h-4 w-4" /> Projects
      </RouterLink>

      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ projectStore.current.name }}
          </h1>
          <ProjectStatusBadge :status="projectStore.current.status" />
        </div>

        <div class="flex gap-2">
          <BaseButton
            v-if="projectStore.canManage"
            variant="secondary"
            @click="editOpen = true"
          >
            <Pencil class="h-4 w-4" /> Edit
          </BaseButton>
          <BaseButton
            v-if="auth.isAdmin"
            variant="danger"
            @click="removeProject"
          >
            <Trash2 class="h-4 w-4" /> Hapus
          </BaseButton>
        </div>
      </div>
    </div>

    <nav class="flex gap-6 border-b border-gray-200">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name, params: { id: route.params.id } }"
        class="-mb-px border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-900"
        exact-active-class="!border-indigo-600 !text-indigo-600"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>

    <RouterView />

    <ProjectFormModal
      :open="editOpen"
      :project="projectStore.current"
      @close="editOpen = false"
    />
    <TaskFormModal
      :open="taskModal.open"
      :task="taskModal.task"
      :project-id="route.params.id"
      :members="members"
      :can-manage="projectStore.canManage"
      @close="taskModal.open = false"
    />
  </div>
</template>
