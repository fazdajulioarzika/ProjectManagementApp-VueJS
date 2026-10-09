<script setup>
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import "@/plugins/chart";
import { useChartTheme } from "@/composables/useChartTheme";
import { TASK_PRIORITY } from "@/utils/constants";

const props = defineProps({ data: { type: Object, required: true } });

const theme = useChartTheme();
const keys = Object.keys(TASK_PRIORITY);
const colors = {
  low: "#94a3b8",
  medium: "#0ea5e9",
  high: "#f97316",
  urgent: "#ef4444",
};

const chartData = computed(() => ({
  labels: keys.map((k) => TASK_PRIORITY[k].label),
  datasets: [
    {
      data: keys.map((k) => props.data[k] ?? 0),
      backgroundColor: keys.map((k) => colors[k]),
      borderRadius: 6,
    },
  ],
}));

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: theme.value.text }, grid: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { color: theme.value.text, precision: 0 },
      grid: { color: theme.value.grid },
    },
  },
}));
</script>

<template>
  <div class="h-64">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
