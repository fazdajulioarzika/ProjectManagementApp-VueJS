<script setup>
import { Sun, Moon } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";

const { isDark, toggle } = useTheme();
</script>

<template>
  <button
    class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    :title="isDark ? 'Mode terang' : 'Mode gelap'"
    :aria-label="isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'"
    @click="toggle"
  >
    <Sun v-if="isDark" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </button>
</template>
