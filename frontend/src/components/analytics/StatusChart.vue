<script setup>
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import "@/plugins/chart";
import { useChartTheme } from "@/composables/useChartTheme";
import { TASK_STATUS } from "@/utils/constants";

const props = defineProps({ data: { type: Object, required: true } });

const theme = useChartTheme();
const keys = Object.keys(TASK_STATUS);
const colors = {
  todo: "#9ca3af",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
};

const chartData = computed(() => ({
  labels: keys.map((k) => TASK_STATUS[k].label),
  datasets: [
    {
      data: keys.map((k) => props.data[k] ?? 0),
      backgroundColor: keys.map((k) => colors[k]),
      borderColor: theme.value.surface,
      borderWidth: 3,
    },
  ],
}));

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: theme.value.text, usePointStyle: true, padding: 16 },
    },
  },
}));
</script>

<template>
  <div class="h-64">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>
