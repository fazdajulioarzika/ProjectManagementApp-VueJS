<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Bell } from "lucide-vue-next";
import { useNotificationStore } from "@/stores/notification";
import { notificationLink } from "@/utils/notification";
import { timeAgo } from "@/utils/format";

const store = useNotificationStore();
const router = useRouter();
const open = ref(false);
let timer;

onMounted(() => {
  store.fetch();
  timer = setInterval(store.fetch, 60000); // cek ulang tiap 1 menit (belum realtime)
});
onUnmounted(() => clearInterval(timer));

function openItem(n) {
  open.value = false;
  store.markRead(n._id);
  router.push(notificationLink(n));
}
</script>

<template>
  <div class="relative">
    <button
      class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      title="Notifikasi"
      @click="open = !open"
    >
      <Bell class="h-5 w-5" />
      <span
        v-if="store.unreadCount"
        class="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
      >
        {{ store.unreadCount > 9 ? "9+" : store.unreadCount }}
      </span>
    </button>

    <template v-if="open">
      <div class="fixed inset-0 z-10" @click="open = false" />

      <div
        class="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 px-4 py-3"
        >
          <h3 class="text-sm font-semibold text-gray-900">Notifikasi</h3>
          <button
            v-if="store.unreadCount"
            class="text-xs text-indigo-600 hover:underline"
            @click="store.markAllRead()"
          >
            Tandai semua dibaca
          </button>
        </div>

        <p
          v-if="!store.items.length"
          class="px-4 py-6 text-center text-sm text-gray-500"
        >
          Belum ada notifikasi.
        </p>

        <ul v-else class="max-h-80 divide-y divide-gray-100 overflow-y-auto">
          <li
            v-for="n in store.items.slice(0, 8)"
            :key="n._id"
            class="cursor-pointer px-4 py-3 text-sm hover:bg-gray-50"
            :class="!n.read && 'bg-indigo-50/60'"
            @click="openItem(n)"
          >
            <p class="text-gray-800">{{ n.message }}</p>
            <p class="mt-0.5 text-xs text-gray-400">
              {{ timeAgo(n.createdAt) }}
            </p>
          </li>
        </ul>

        <RouterLink
          to="/notifications"
          class="block border-t border-gray-100 px-4 py-2.5 text-center text-sm text-indigo-600 hover:bg-gray-50"
          @click="open = false"
        >
          Lihat semua
        </RouterLink>
      </div>
    </template>
  </div>
</template>
