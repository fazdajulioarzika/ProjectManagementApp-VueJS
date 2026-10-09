<script setup>
import { reactive, watch } from "vue";
import draggable from "vuedraggable";
import { TASK_STATUS } from "@/utils/constants";
import TaskCard from "./TaskCard.vue";

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  canMove: { type: Function, default: () => true },
});
const emit = defineEmits(["move", "open"]);

const statuses = Object.keys(TASK_STATUS);
const accent = {
  todo: "border-t-gray-400",
  in_progress: "border-t-blue-500",
  review: "border-t-amber-500",
  done: "border-t-green-500",
};

// Kolom dibangun dari daftar task; setiap perubahan di store membangunnya ulang
const columns = reactive({ todo: [], in_progress: [], review: [], done: [] });

watch(
  () => props.tasks,
  (tasks) => {
    statuses.forEach((s) => {
      columns[s] = tasks.filter((t) => t.status === s);
    });
  },
  { immediate: true }
);

// Batalkan drag jika user tidak berhak memindahkan task ini
const checkMove = (evt) => props.canMove(evt.draggedContext.element);

function onChange(status, evt) {
  // "added" = kartu dijatuhkan ke kolom ini dari kolom lain
  if (evt.added) emit("move", { task: evt.added.element, status });
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <section
      v-for="status in statuses"
      :key="status"
      class="rounded-xl border border-t-4 border-gray-200 bg-gray-100/70 p-3"
      :class="accent[status]"
    >
      <div class="mb-3 flex items-center justify-between px-1">
        <h3 class="text-sm font-semibold text-gray-700">
          {{ TASK_STATUS[status].label }}
        </h3>
        <span class="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">
          {{ columns[status].length }}
        </span>
      </div>

      <draggable
        v-model="columns[status]"
        group="tasks"
        item-key="_id"
        :animation="150"
        :move="checkMove"
        ghost-class="opacity-40"
        class="min-h-24 space-y-3"
        @change="onChange(status, $event)"
      >
        <template #item="{ element }">
          <TaskCard :task="element" @click="emit('open', element)" />
        </template>
      </draggable>
    </section>
  </div>
</template>
