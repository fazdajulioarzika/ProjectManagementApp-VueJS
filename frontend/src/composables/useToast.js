import { ref } from "vue";

const toasts = ref([]);
let seq = 0;

export function useToast() {
  function show(message, type = "error", duration = 4000) {
    const toast = { id: ++seq, message, type };
    toasts.value.push(toast);
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== toast.id);
    }, duration);
  }

  return {
    toasts,
    show,
    error: (message) => show(message, "error"),
    success: (message) => show(message, "success"),
  };
}
