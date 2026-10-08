<script setup>
import { ref, computed, onMounted } from "vue";
import { FolderKanban, ListChecks, CheckCheck, Clock } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import dashboardService from "@/services/dashboard";
import { formatDate, isOverdue } from "@/utils/format";
import StatCard from "@/components/dashboard/StatCard.vue";
import ProgressBar from "@/components/ui/ProgressBar.vue";
import StatusBadge from "@/components/task/StatusBadge.vue";
import PriorityBadge from "@/components/task/PriorityBadge.vue";

const auth = useAuthStore();
const data = ref(null);
const loading = ref(true);
const error = ref("");

const firstName = computed(() => auth.user?.name?.split(" ")[0]);

onMounted(async () => {
  try {
    data.value = await dashboardService.get();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        Selamat datang, {{ firstName }}
      </h1>
      <p class="text-sm text-gray-500">
        Ringkasan kondisi project Anda saat ini.
      </p>
    </div>

    <p v-if="loading" class="text-gray-500">Memuat data...</p>
    <p
      v-else-if="error"
      class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </p>

    <template v-else>
      <!-- Statistik -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Projects"
          :value="data.stats.totalProjects"
          :icon="FolderKanban"
        />
        <StatCard
          label="Total Tasks"
          :value="data.stats.totalTasks"
          :icon="ListChecks"
          tone="bg-sky-100 text-sky-600"
        />
        <StatCard
          label="Completed"
          :value="data.stats.completed"
          :icon="CheckCheck"
          tone="bg-green-100 text-green-600"
        />
        <StatCard
          label="Overdue"
          :value="data.stats.overdue"
          :icon="Clock"
          tone="bg-red-100 text-red-600"
        />
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <!-- Progress project -->
        <section
          class="rounded-xl border border-gray-200 bg-white p-5 xl:col-span-1"
        >
          <h2 class="mb-4 font-semibold text-gray-900">Project Progress</h2>

          <p v-if="!data.projectProgress.length" class="text-sm text-gray-500">
            Belum ada project.
          </p>

          <ul v-else class="space-y-4">
            <li v-for="p in data.projectProgress" :key="p._id">
              <div class="mb-1 flex justify-between text-sm">
                <span class="truncate font-medium text-gray-700">{{
                  p.name
                }}</span>
                <span class="text-gray-500">{{ p.progress }}%</span>
              </div>
              <ProgressBar :value="p.progress" />
            </li>
          </ul>
        </section>

        <!-- Recent tasks -->
        <section
          class="rounded-xl border border-gray-200 bg-white p-5 xl:col-span-2"
        >
          <h2 class="mb-4 font-semibold text-gray-900">Recent Tasks</h2>

          <p v-if="!data.recentTasks.length" class="text-sm text-gray-500">
            Belum ada task.
          </p>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-gray-200 text-gray-500">
                <tr>
                  <th class="pb-2 font-medium">Task</th>
                  <th class="pb-2 font-medium">Project</th>
                  <th class="pb-2 font-medium">Priority</th>
                  <th class="pb-2 font-medium">Status</th>
                  <th class="pb-2 font-medium">Due</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="t in data.recentTasks" :key="t._id">
                  <td class="py-3 pr-4 font-medium text-gray-900">
                    {{ t.title }}
                  </td>
                  <td class="py-3 pr-4 text-gray-600">{{ t.project?.name }}</td>
                  <td class="py-3 pr-4">
                    <PriorityBadge :priority="t.priority" />
                  </td>
                  <td class="py-3 pr-4"><StatusBadge :status="t.status" /></td>
                  <td
                    class="whitespace-nowrap py-3"
                    :class="
                      isOverdue(t)
                        ? 'font-medium text-red-600'
                        : 'text-gray-600'
                    "
                  >
                    {{ formatDate(t.dueDate) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
