<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { ListChecks, CheckCheck, Clock, Percent } from "lucide-vue-next";
import analyticsService from "@/services/analytics";
import StatCard from "@/components/dashboard/StatCard.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import StatusChart from "@/components/analytics/StatusChart.vue";
import PriorityChart from "@/components/analytics/PriorityChart.vue";
import WorkloadChart from "@/components/analytics/WorkloadChart.vue";
import CompletionChart from "@/components/analytics/CompletionChart.vue";

const data = ref(null);
const projectId = ref("");
const days = ref(14);
const loading = ref(true);
const error = ref("");
let requestId = 0; // mencegah respons lama menimpa respons yang lebih baru

const rangeOptions = [7, 14, 30];

const projectOptions = computed(() => [
  { value: "", label: "Semua project" },
  ...(data.value?.projects ?? []).map((p) => ({ value: p._id, label: p.name })),
]);

const totalInRange = computed(
  () => data.value?.completedPerDay.reduce((sum, d) => sum + d.count, 0) ?? 0
);

async function load() {
  const id = ++requestId;
  loading.value = true;
  error.value = "";
  try {
    const result = await analyticsService.get({
      project: projectId.value || undefined,
      days: days.value,
    });
    if (id === requestId) data.value = result;
  } catch (e) {
    if (id === requestId) error.value = e.message;
  } finally {
    if (id === requestId) loading.value = false;
  }
}

watch([projectId, days], load);
onMounted(load);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
        <p class="text-sm text-gray-500">
          Gambaran progress dan beban kerja tim.
          <span v-if="loading && data" class="text-gray-400"
            >Memperbarui...</span
          >
        </p>
      </div>
      <div class="w-56">
        <BaseSelect v-model="projectId" :options="projectOptions" />
      </div>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ error }}
    </p>
    <p v-else-if="!data" class="text-gray-500">Memuat data...</p>

    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tasks"
          :value="data.summary.totalTasks"
          :icon="ListChecks"
        />
        <StatCard
          label="Completed"
          :value="data.summary.completed"
          :icon="CheckCheck"
          tone="bg-green-100 text-green-600"
        />
        <StatCard
          label="Overdue"
          :value="data.summary.overdue"
          :icon="Clock"
          tone="bg-red-100 text-red-600"
        />
        <StatCard
          label="Completion Rate"
          :value="`${data.summary.completionRate}%`"
          :icon="Percent"
          tone="bg-sky-100 text-sky-600"
        />
      </div>

      <div
        v-if="!data.summary.totalTasks"
        class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
      >
        Belum ada task untuk dianalisis.
      </div>

      <template v-else>
        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-xl border border-gray-200 bg-white p-5">
            <h2 class="mb-4 font-semibold text-gray-900">Task per Status</h2>
            <StatusChart :data="data.byStatus" />
          </section>

          <section class="rounded-xl border border-gray-200 bg-white p-5">
            <h2 class="mb-4 font-semibold text-gray-900">Task per Prioritas</h2>
            <PriorityChart :data="data.byPriority" />
          </section>
        </div>

        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="mb-4 font-semibold text-gray-900">
            Beban Kerja per Anggota
          </h2>
          <WorkloadChart :rows="data.byAssignee" />
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold text-gray-900">Task Selesai per Hari</h2>
              <p class="text-xs text-gray-500">
                {{ totalInRange }} task selesai dalam {{ days }} hari terakhir
              </p>
            </div>
            <div class="flex gap-1 rounded-lg bg-gray-100 p-1">
              <button
                v-for="d in rangeOptions"
                :key="d"
                class="rounded-md px-3 py-1 text-xs font-medium transition"
                :class="
                  days === d
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                "
                @click="days = d"
              >
                {{ d }} hari
              </button>
            </div>
          </div>
          <CompletionChart :points="data.completedPerDay" />
        </section>
      </template>
    </template>
  </div>
</template>
