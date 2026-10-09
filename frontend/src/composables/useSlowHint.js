import { ref, onUnmounted } from "vue";

export function useSlowHint(delay = 4000) {
  const slow = ref(false);
  let timer;

  const start = () => {
    timer = setTimeout(() => (slow.value = true), delay);
  };
  const stop = () => {
    clearTimeout(timer);
    slow.value = false;
  };

  onUnmounted(() => clearTimeout(timer));
  return { slow, start, stop };
}
