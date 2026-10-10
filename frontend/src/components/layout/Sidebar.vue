<script setup>
import { computed } from "vue";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  TrendingUp,
  CalendarDays,
  Users,
  Settings,
  X,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

defineProps({ open: Boolean });
defineEmits(["close"]);

const auth = useAuthStore();

const items = computed(() => [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Tasks", to: "/tasks", icon: ListChecks },
  { label: "Analytics", to: "/analytics", icon: TrendingUp },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  ...(auth.canCreateProject
    ? [{ label: "Members", to: "/members", icon: Users }]
    : []),
  { label: "Settings", to: "/settings", icon: Settings },
]);
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-black/40 lg:hidden"
    @click="$emit('close')"
  />

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-slate-900 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-16 items-center justify-between px-6">
      <span class="text-xl font-bold text-white">TaskFlow</span>
      <button class="lg:hidden" @click="$emit('close')">
        <X class="h-5 w-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-4">
      <RouterLink
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        active-class="bg-slate-800 text-white"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-slate-800 hover:text-white"
        @click="$emit('close')"
      >
        <component :is="item.icon" class="h-5 w-5" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
