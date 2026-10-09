<script setup>
import { useRouter } from "vue-router";
import { Menu, LogOut } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import UserAvatar from "@/components/ui/UserAvatar.vue";

defineEmits(["toggle-sidebar"]);

const auth = useAuthStore();
const router = useRouter();

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
      <RouterLink
        to="/profile"
        class="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-50"
      >
        <UserAvatar :name="auth.user?.name" :avatar="auth.user?.avatar" />
        <div class="hidden text-sm leading-tight sm:block">
          <p class="font-medium text-gray-900">{{ auth.user?.name }}</p>
          <p class="capitalize text-gray-500">{{ auth.user?.role }}</p>
        </div>
      </RouterLink>
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
