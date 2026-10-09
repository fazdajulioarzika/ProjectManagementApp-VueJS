<script setup>
import { CalendarDays } from "lucide-vue-next";
import { formatDate, isOverdue } from "@/utils/format";
import PriorityBadge from "./PriorityBadge.vue";

defineProps({ task: Object });
</script>

<template>
  <div
    class="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-indigo-300 active:cursor-grabbing"
  >
    <p class="text-sm font-medium text-gray-900">{{ task.title }}</p>

    <div class="mt-2 flex items-center justify-between">
      <PriorityBadge :priority="task.priority" />
      <div
        v-if="task.assignee"
        :title="task.assignee.name"
        class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
      >
        {{ task.assignee.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <p
      v-if="task.dueDate"
      class="mt-2 flex items-center gap-1 text-xs"
      :class="isOverdue(task) ? 'font-medium text-red-600' : 'text-gray-500'"
    >
      <CalendarDays class="h-3.5 w-3.5" />
      {{ formatDate(task.dueDate) }}
    </p>
  </div>
</template>
