import { ref } from "vue";

// Dibaca dari <html>, yang sudah diatur skrip di index.html sebelum Vue jalan
const isDark = ref(document.documentElement.classList.contains("dark"));

export function useTheme() {
  function set(dark) {
    isDark.value = dark;
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // penyimpanan tidak tersedia, tema tetap berlaku untuk sesi ini
    }
  }

  return { isDark, toggle: () => set(!isDark.value) };
}
