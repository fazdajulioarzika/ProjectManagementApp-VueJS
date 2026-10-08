<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.logout();
  router.push("/login");
}
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="mt-2">Halo, {{ auth.user?.name }} ({{ auth.user?.role }})</p>
    <button
      @click="logout"
      class="mt-4 px-4 py-2 bg-gray-800 text-white rounded"
    >
      Logout
    </button>
  </div>
</template>
