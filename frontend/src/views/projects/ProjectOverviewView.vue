<script setup>
import { computed } from "vue";
import { useProjectStore } from "@/stores/project";
import { useTaskStore } from "@/stores/task";
import { formatDate } from "@/utils/format";
import ProgressBar from "@/components/ui/ProgressBar.vue";

const projectStore = useProjectStore();
const taskStore = useTaskStore();

const project = computed(() => projectStore.current);
const stats = computed(() => taskStore.stats);
</script>

<template>
  <div v-if="project" class="grid gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">
      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="mb-2 font-semibold text-gray-900">Description</h2>
        <p class="whitespace-pre-line text-sm text-gray-600">
          {{ project.description || "Tidak ada deskripsi." }}
        </p>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Progress</h2>
          <span class="text-sm font-medium text-gray-700"
            >{{ stats.progress }}%</span
          >
        </div>
        <ProgressBar :value="stats.progress" />
        <p class="mt-2 text-sm text-gray-500">
          {{ stats.done }} dari {{ stats.total }} task selesai
        </p>
      </section>
    </div>

    <div class="space-y-6">
      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="mb-3 font-semibold text-gray-900">Detail</h2>
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="text-gray-500">Start</dt>
            <dd class="font-medium text-gray-900">
              {{ formatDate(project.startDate) }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Deadline</dt>
            <dd class="font-medium text-gray-900">
              {{ formatDate(project.endDate) }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Owner</dt>
            <dd class="font-medium text-gray-900">{{ project.owner?.name }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="mb-3 font-semibold text-gray-900">
          Members ({{ project.members.length }})
        </h2>
        <ul class="space-y-3">
          <li
            v-for="m in project.members"
            :key="m.user._id"
            class="flex items-center gap-3"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
            >
              {{ m.user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="text-sm leading-tight">
              <p class="font-medium text-gray-900">{{ m.user.name }}</p>
              <p class="text-gray-500">{{ m.title }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
