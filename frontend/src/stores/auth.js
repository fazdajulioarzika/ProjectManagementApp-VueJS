import { defineStore } from "pinia";
import { ref, computed } from "vue";
import authService from "@/services/auth";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token"));
  const user = ref(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");
  const canCreateProject = computed(() =>
    ["admin", "manager"].includes(user.value?.role)
  );

  function setSession(data) {
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem("token", data.token);
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
  }

  async function login(credentials) {
    setSession(await authService.login(credentials));
  }

  async function register(payload) {
    setSession(await authService.register(payload));
  }

  // Dipanggil saat halaman di-refresh: token ada, data user perlu diambil lagi
  async function fetchMe() {
    try {
      user.value = await authService.me();
    } catch {
      clearSession();
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      // abaikan error, tetap logout di sisi client
    }
    clearSession();
  }

  async function updateProfile(payload) {
    user.value = await authService.updateProfile(payload);
  }

  async function changePassword(payload) {
    await authService.changePassword(payload);
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    canCreateProject,
    login,
    register,
    fetchMe,
    logout,
    updateProfile,
    changePassword,
  };
});
