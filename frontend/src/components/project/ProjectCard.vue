<script setup>
import { CalendarDays } from "lucide-vue-next";
import { formatDate } from "@/utils/format";
import ProgressBar from "@/components/ui/ProgressBar.vue";
import ProjectStatusBadge from "./ProjectStatusBadge.vue";

defineProps({ project: Object });
</script>

<template>
  <RouterLink
    :to="{ name: 'project-overview', params: { id: project._id } }"
    class="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
  >
    <div class="mb-2 flex items-start justify-between gap-2">
      <h3 class="font-semibold text-gray-900">{{ project.name }}</h3>
      <ProjectStatusBadge :status="project.status" />
    </div>

    <p class="mb-4 line-clamp-2 min-h-10 text-sm text-gray-500">
      {{ project.description || "Tidak ada deskripsi" }}
    </p>

    <div class="mb-1 flex justify-between text-xs text-gray-500">
      <span>{{ project.doneTasks }}/{{ project.totalTasks }} task selesai</span>
      <span>{{ project.progress }}%</span>
    </div>
    <ProgressBar :value="project.progress" />

    <p class="mt-4 flex items-center gap-1 text-xs text-gray-500">
      <CalendarDays class="h-3.5 w-3.5" />
      Deadline: {{ formatDate(project.endDate) }}
    </p>
  </RouterLink>
</template>
