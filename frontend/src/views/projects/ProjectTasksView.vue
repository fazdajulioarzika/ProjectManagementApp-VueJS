<script setup>
import { inject, computed } from "vue";
import { storeToRefs } from "pinia";
import { Plus } from "lucide-vue-next";
import { useProjectStore } from "@/stores/project";
import { useTaskStore } from "@/stores/task";
import { useTaskFilters } from "@/composables/useTaskFilters";
import { formatDate, isOverdue } from "@/utils/format";
import BaseButton from "@/components/ui/BaseButton.vue";
import StatusBadge from "@/components/task/StatusBadge.vue";
import PriorityBadge from "@/components/task/PriorityBadge.vue";
import TaskFilters from "@/components/task/TaskFilters.vue";

const projectStore = useProjectStore();
const taskStore = useTaskStore();
const taskModal = inject("taskModal");

const { tasks } = storeToRefs(taskStore);
const { filters, filtered, active, reset } = useTaskFilters(tasks);

const assignees = computed(() =>
  (projectStore.current?.members ?? []).map((m) => m.user).filter(Boolean)
);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <TaskFilters
          v-model="filters"
          :assignees="assignees"
          :active="active"
          @reset="reset"
        />
      </div>
      <BaseButton v-if="projectStore.canManage" @click="taskModal.openCreate()">
        <Plus class="h-4 w-4" /> Task Baru
      </BaseButton>
    </div>

    <div
      v-if="!tasks.length"
      class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
    >
      Belum ada task di project ini.
    </div>

    <div
      v-else-if="!filtered.length"
      class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
    >
      Tidak ada task yang cocok dengan filter.
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
            v-for="t in filtered"
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

    <p v-if="active && filtered.length" class="text-xs text-gray-500">
      Menampilkan {{ filtered.length }} dari {{ tasks.length }} task.
    </p>
  </div>
</template>
