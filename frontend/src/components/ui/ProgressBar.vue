<script setup>
defineProps({ value: { type: Number, default: 0 } });
</script>

<template>
  <div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
    <div
      class="h-full rounded-full transition-all duration-500"
      :class="value >= 100 ? 'bg-green-500' : 'bg-indigo-500'"
      :style="{ width: value + '%' }"
    />
  </div>
</template>
