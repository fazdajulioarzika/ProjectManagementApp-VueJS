<script setup>
import { inject } from "vue";
import { Plus } from "lucide-vue-next";
import { useProjectStore } from "@/stores/project";
import { useTaskStore } from "@/stores/task";
import { formatDate, isOverdue } from "@/utils/format";
import BaseButton from "@/components/ui/BaseButton.vue";
import StatusBadge from "@/components/task/StatusBadge.vue";
import PriorityBadge from "@/components/task/PriorityBadge.vue";

const projectStore = useProjectStore();
const taskStore = useTaskStore();
const taskModal = inject("taskModal");
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <BaseButton v-if="projectStore.canManage" @click="taskModal.openCreate()">
        <Plus class="h-4 w-4" /> Task Baru
      </BaseButton>
    </div>

    <div
      v-if="!taskStore.tasks.length"
      class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
    >
      Belum ada task di project ini.
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-xl border border-gray-200 bg-white"
    >
      <table class="w-full text-left text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Task</th>
            <th class="px-4 py-3 font-medium">Priority</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Assignee</th>
            <th class="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="t in taskStore.tasks"
            :key="t._id"
            class="cursor-pointer hover:bg-gray-50"
            @click="taskModal.openEdit(t)"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ t.title }}</td>
            <td class="px-4 py-3"><PriorityBadge :priority="t.priority" /></td>
            <td class="px-4 py-3"><StatusBadge :status="t.status" /></td>
            <td class="px-4 py-3 text-gray-600">
              {{ t.assignee?.name ?? "-" }}
            </td>
            <td
              class="whitespace-nowrap px-4 py-3"
              :class="
                isOverdue(t) ? 'font-medium text-red-600' : 'text-gray-600'
              "
            >
              {{ formatDate(t.dueDate) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
