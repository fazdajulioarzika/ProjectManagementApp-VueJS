<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Plus } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useProjectStore } from "@/stores/project";
import BaseButton from "@/components/ui/BaseButton.vue";
import ProjectCard from "@/components/project/ProjectCard.vue";
import ProjectFormModal from "@/components/project/ProjectFormModal.vue";

const auth = useAuthStore();
const store = useProjectStore();
const router = useRouter();

const showForm = ref(false);
const error = ref("");

onMounted(async () => {
  try {
    await store.fetchAll();
  } catch (e) {
    error.value = e.message;
  }
});

function onCreated(project) {
  router.push({ name: "project-overview", params: { id: project._id } });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
        <p class="text-sm text-gray-500">Semua project yang Anda ikuti.</p>
      </div>
      <BaseButton v-if="auth.canCreateProject" @click="showForm = true">
        <Plus class="h-4 w-4" /> Project Baru
      </BaseButton>
    </div>

    <p v-if="store.loading" class="text-gray-500">Memuat project...</p>
    <p
      v-else-if="error"
      class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </p>

    <div
      v-else-if="!store.projects.length"
      class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
    >
      Belum ada project.
      <span v-if="auth.canCreateProject"
        >Klik "Project Baru" untuk memulai.</span
      >
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ProjectCard v-for="p in store.projects" :key="p._id" :project="p" />
    </div>

    <ProjectFormModal
      :open="showForm"
      @close="showForm = false"
      @saved="onCreated"
    />
  </div>
</template>
