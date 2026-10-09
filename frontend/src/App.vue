<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ToastContainer from "@/components/ui/ToastContainer.vue";

const router = useRouter();
const ready = ref(false);
router.isReady().then(() => (ready.value = true));
</script>

<template>
  <RouterView v-if="ready" />

  <div
    v-else
    class="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center"
  >
    <div
      class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
    />
    <p class="text-sm font-medium text-gray-700">Menghubungkan ke server...</p>
    <p class="max-w-xs text-xs text-gray-500">
      Server gratis tidur saat tidak dipakai, jadi pembukaan pertama bisa
      memakan waktu sampai 1 menit.
    </p>
  </div>

  <ToastContainer />
</template>
