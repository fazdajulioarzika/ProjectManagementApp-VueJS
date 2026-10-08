<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Menu, LogOut } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

defineEmits(["toggle-sidebar"]);

const auth = useAuthStore();
const router = useRouter();

const initial = computed(() => auth.user?.name?.charAt(0).toUpperCase() ?? "?");

async function logout() {
  await auth.logout();
  router.push("/login");
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6"
  >
    <button
      class="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
      @click="$emit('toggle-sidebar')"
    >
      <Menu class="h-5 w-5" />
    </button>
    <div class="hidden lg:block" />

    <div class="flex items-center gap-3">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
      >
        {{ initial }}
      </div>
      <div class="hidden text-sm leading-tight sm:block">
        <p class="font-medium text-gray-900">{{ auth.user?.name }}</p>
        <p class="capitalize text-gray-500">{{ auth.user?.role }}</p>
      </div>
      <button
        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        title="Logout"
        @click="logout"
      >
        <LogOut class="h-5 w-5" />
      </button>
    </div>
  </header>
</template>
