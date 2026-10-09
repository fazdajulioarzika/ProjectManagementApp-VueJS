<script setup>
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import "@/plugins/chart";
import { useChartTheme } from "@/composables/useChartTheme";

const props = defineProps({ rows: { type: Array, default: () => [] } });

const theme = useChartTheme();

const chartData = computed(() => ({
  labels: props.rows.map((r) => r.name ?? "Belum ditugaskan"),
  datasets: [
    {
      label: "Selesai",
      data: props.rows.map((r) => r.done),
      backgroundColor: "#22c55e",
      borderRadius: 4,
    },
    {
      label: "Belum selesai",
      data: props.rows.map((r) => r.total - r.done),
      backgroundColor: "#6366f1",
      borderRadius: 4,
    },
  ],
}));

const options = computed(() => ({
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: theme.value.text, usePointStyle: true, padding: 16 },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      ticks: { color: theme.value.text, precision: 0 },
      grid: { color: theme.value.grid },
    },
    y: {
      stacked: true,
      ticks: { color: theme.value.text },
      grid: { display: false },
    },
  },
}));

// Tinggi menyesuaikan jumlah anggota agar label tidak menumpuk
const height = computed(
  () => `${Math.max(180, props.rows.length * 44 + 70)}px`
);
</script>

<template>
  <div :style="{ height }">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
