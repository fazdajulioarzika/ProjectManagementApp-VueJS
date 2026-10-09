<script setup>
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Settings,
  X,
} from "lucide-vue-next";

defineProps({ open: Boolean });
defineEmits(["close"]);

const items = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Tasks", icon: ListChecks, soon: true },
  { label: "Members", icon: Users, soon: true },
  { label: "Settings", icon: Settings, soon: true },
];
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
      <template v-for="item in items" :key="item.label">
        <div
          v-if="item.soon"
          class="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-50"
        >
          <component :is="item.icon" class="h-5 w-5" />
          <span class="flex-1">{{ item.label }}</span>
          <span class="rounded bg-slate-700 px-1.5 py-0.5 text-[10px]"
            >Segera</span
          >
        </div>

        <RouterLink
          v-else
          :to="item.to"
          active-class="bg-slate-800 text-white"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-slate-800 hover:text-white"
          @click="$emit('close')"
        >
          <component :is="item.icon" class="h-5 w-5" />
          {{ item.label }}
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>
