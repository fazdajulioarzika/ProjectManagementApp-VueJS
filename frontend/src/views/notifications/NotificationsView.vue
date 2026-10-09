<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { notificationLink } from "@/utils/notification";
import { timeAgo } from "@/utils/format";
import BaseButton from "@/components/ui/BaseButton.vue";

const store = useNotificationStore();
const router = useRouter();

onMounted(() => store.fetch());

function openItem(n) {
  store.markRead(n._id);
  router.push(notificationLink(n));
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Notifications</h1>
        <p class="text-sm text-gray-500">30 notifikasi terbaru.</p>
      </div>
      <BaseButton
        v-if="store.unreadCount"
        variant="secondary"
        @click="store.markAllRead()"
      >
        Tandai semua dibaca
      </BaseButton>
    </div>

    <div
      v-if="!store.items.length"
      class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
    >
      Belum ada notifikasi.
    </div>

    <ul
      v-else
      class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white"
    >
      <li
        v-for="n in store.items"
        :key="n._id"
        class="flex cursor-pointer items-start gap-3 px-5 py-4 hover:bg-gray-50"
        :class="!n.read && 'bg-indigo-50/60'"
        @click="openItem(n)"
      >
        <span
          class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          :class="n.read ? 'bg-transparent' : 'bg-indigo-600'"
        />
        <div class="text-sm">
          <p class="text-gray-800">{{ n.message }}</p>
          <p class="mt-0.5 text-xs text-gray-400">{{ timeAgo(n.createdAt) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
