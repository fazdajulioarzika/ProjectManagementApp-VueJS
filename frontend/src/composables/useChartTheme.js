import { computed } from "vue";
import { useTheme } from "./useTheme";

export function useChartTheme() {
  const { isDark } = useTheme();

  return computed(() => ({
    text: isDark.value ? "#aab4c5" : "#6b7280",
    grid: isDark.value ? "#263248" : "#e5e7eb",
    surface: isDark.value ? "#111a2b" : "#ffffff",
  }));
}
