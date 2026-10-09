<script setup>
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 to-gray-100 p-4"
  >
    <div class="absolute right-4 top-4">
      <ThemeToggle />
    </div>

    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <h1 class="text-3xl font-bold text-indigo-600">TaskFlow</h1>
        <p class="mt-1 text-sm text-gray-500">
          Kelola project dan task tim Anda dengan sederhana
        </p>
      </div>
      <div
        class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <RouterView />
      </div>
    </div>
  </div>
</template>
