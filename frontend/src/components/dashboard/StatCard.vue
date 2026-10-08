<script setup>
defineProps({
  label: String,
  value: [Number, String],
  icon: Object,
  tone: { type: String, default: "bg-indigo-100 text-indigo-600" },
});
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5"
  >
    <div class="rounded-lg p-3" :class="tone">
      <component :is="icon" class="h-6 w-6" />
    </div>
    <div>
      <p class="text-sm text-gray-500">{{ label }}</p>
      <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
    </div>
  </div>
</template>
