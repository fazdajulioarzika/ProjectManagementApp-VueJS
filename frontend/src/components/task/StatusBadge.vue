<script setup>
import { TASK_STATUS } from "@/utils/constants";
defineProps({ status: String });
</script>

<template>
  <span
    class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="TASK_STATUS[status]?.class"
  >
    {{ TASK_STATUS[status]?.label ?? status }}
  </span>
</template>
