<script setup>
import { inject } from "vue";
import { Plus } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useProjectStore } from "@/stores/project";
import { useTaskStore } from "@/stores/task";
import { useToast } from "@/composables/useToast";
import BaseButton from "@/components/ui/BaseButton.vue";
import KanbanBoard from "@/components/task/KanbanBoard.vue";

const auth = useAuthStore();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const toast = useToast();
const taskModal = inject("taskModal");

// Manager boleh memindahkan semua task, member hanya task miliknya
const canMove = (task) =>
  projectStore.canManage || task.assignee?._id === auth.user?._id;

async function onMove({ task, status }) {
  try {
    await taskStore.updateStatus(task._id, status);
  } catch (e) {
    toast.error(e.message); // store sudah mengembalikan posisi kartu
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p v-if="!projectStore.canManage" class="text-sm text-gray-500">
        Anda hanya dapat memindahkan task yang ditugaskan kepada Anda.
      </p>
      <span v-else />
      <BaseButton v-if="projectStore.canManage" @click="taskModal.openCreate()">
        <Plus class="h-4 w-4" /> Task Baru
      </BaseButton>
    </div>

    <KanbanBoard
      :tasks="taskStore.tasks"
      :can-move="canMove"
      @move="onMove"
      @open="taskModal.openEdit"
    />
  </div>
</template>
