<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";
import "@/plugins/chart";
import { useChartTheme } from "@/composables/useChartTheme";

const props = defineProps({ points: { type: Array, default: () => [] } }); // [{ date, count }]

const theme = useChartTheme();

const label = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

const chartData = computed(() => ({
  labels: props.points.map((p) => label(p.date)),
  datasets: [
    {
      label: "Task selesai",
      data: props.points.map((p) => p.count),
      borderColor: "#6366f1",
      backgroundColor: "rgba(99, 102, 241, 0.15)",
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: "#6366f1",
    },
  ],
}));

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: theme.value.text, maxTicksLimit: 8 },
      grid: { display: false },
    },
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
    <Line :data="chartData" :options="options" />
  </div>
</template>
