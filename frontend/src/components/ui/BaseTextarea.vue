<script setup>
defineProps({
  modelValue: String,
  label: String,
  placeholder: String,
  rows: { type: Number, default: 3 },
  disabled: Boolean,
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <label class="block">
    <span v-if="label" class="mb-1 block text-sm font-medium text-gray-700">{{
      label
    }}</span>
    <textarea
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:text-gray-500"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>
