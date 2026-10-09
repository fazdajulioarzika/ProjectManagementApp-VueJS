<script setup>
import { useToast } from "@/composables/useToast";
const { toasts } = useToast();
</script>

<template>
  <div class="fixed bottom-4 right-4 z-[60] space-y-2">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="rounded-lg px-4 py-3 text-sm text-white shadow-lg"
      :class="t.type === 'success' ? 'bg-green-600' : 'bg-red-600'"
    >
      {{ t.message }}
    </div>
  </div>
</template>
