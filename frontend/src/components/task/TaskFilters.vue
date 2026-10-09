<script setup>
import { computed } from "vue";
import { TASK_STATUS, TASK_PRIORITY, toOptions } from "@/utils/constants";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";

const props = defineProps({
  modelValue: Object,
  assignees: { type: Array, default: () => [] }, // [{ _id, name }]
  active: Boolean,
});
const emit = defineEmits(["update:modelValue", "reset"]);

const set = (key, value) =>
  emit("update:modelValue", { ...props.modelValue, [key]: value });

const statusOptions = [
  { value: "", label: "Semua status" },
  ...toOptions(TASK_STATUS),
];
const priorityOptions = [
  { value: "", label: "Semua priority" },
  ...toOptions(TASK_PRIORITY),
];
const assigneeOptions = computed(() => [
  { value: "", label: "Semua assignee" },
  { value: "none", label: "Belum ditugaskan" },
  ...props.assignees.map((a) => ({ value: a._id, label: a.name })),
]);
</script>

<template>
  <div class="space-y-2">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <BaseInput
        :model-value="modelValue.search"
        placeholder="Cari task..."
        @update:model-value="set('search', $event)"
      />
      <BaseSelect
        :model-value="modelValue.status"
        :options="statusOptions"
        @update:model-value="set('status', $event)"
      />
      <BaseSelect
        :model-value="modelValue.priority"
        :options="priorityOptions"
        @update:model-value="set('priority', $event)"
      />
      <BaseSelect
        :model-value="modelValue.assignee"
        :options="assigneeOptions"
        @update:model-value="set('assignee', $event)"
      />
    </div>
    <button
      v-if="active"
      class="text-sm text-indigo-600 hover:underline"
      @click="emit('reset')"
    >
      Reset filter
    </button>
  </div>
</template>
