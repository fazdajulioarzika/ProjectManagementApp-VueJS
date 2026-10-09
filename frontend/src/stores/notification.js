import { defineStore } from "pinia";
import { ref } from "vue";
import notificationService from "@/services/notification";

export const useNotificationStore = defineStore("notification", () => {
  const items = ref([]);
  const unreadCount = ref(0);

  async function fetch() {
    try {
      const data = await notificationService.list();
      items.value = data.notifications;
      unreadCount.value = data.unreadCount;
    } catch {
      // diabaikan, akan dicoba lagi pada polling berikutnya
    }
  }

  async function markRead(id) {
    const n = items.value.find((x) => x._id === id);
    if (!n || n.read) return;
    n.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await notificationService.markRead(id);
    } catch {
      n.read = false;
      unreadCount.value++;
    }
  }

  async function markAllRead() {
    await notificationService.markAllRead();
    items.value.forEach((n) => (n.read = true));
    unreadCount.value = 0;
  }

  function reset() {
    items.value = [];
    unreadCount.value = 0;
  }

  return { items, unreadCount, fetch, markRead, markAllRead, reset };
});
