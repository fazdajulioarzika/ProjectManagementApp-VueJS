<script setup>
import { computed } from "vue";

const props = defineProps({
  name: String,
  avatar: String,
  size: { type: String, default: "md" },
});

const sizes = {
  sm: "h-6 w-6 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-24 w-24 text-3xl",
};

const initial = computed(() => props.name?.charAt(0).toUpperCase() ?? "?");
</script>

<template>
  <img
    v-if="avatar"
    :src="avatar"
    :alt="name"
    class="shrink-0 rounded-full object-cover"
    :class="sizes[size]"
  />
  <div
    v-else
    class="flex shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white"
    :class="sizes[size]"
  >
    {{ initial }}
  </div>
</template>
