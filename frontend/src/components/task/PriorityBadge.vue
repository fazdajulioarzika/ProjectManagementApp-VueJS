<script setup>
import { TASK_PRIORITY } from "@/utils/constants";
defineProps({ priority: String });
</script>

<template>
  <span
    class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="TASK_PRIORITY[priority]?.class"
  >
    {{ TASK_PRIORITY[priority]?.label ?? priority }}
  </span>
</template>
