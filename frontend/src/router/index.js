import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  { path: "/", redirect: "/dashboard" },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/views/dashboard/DashboardView.vue"),
    meta: { requiresAuth: true },
  },
  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Refresh halaman: ada token tapi data user belum dimuat
  if (auth.token && !auth.user) await auth.fetchMe();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "dashboard" };
  }
});

export default router;
