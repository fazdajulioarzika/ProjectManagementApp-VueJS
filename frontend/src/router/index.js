import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AuthLayout from "@/layouts/AuthLayout.vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";

const routes = [
  { path: "/", redirect: "/dashboard" },
  {
    path: "/",
    component: AuthLayout,
    meta: { guestOnly: true },
    children: [
      {
        path: "/login",
        name: "login",
        component: () => import("@/views/auth/LoginView.vue"),
      },
      {
        path: "/register",
        name: "register",
        component: () => import("@/views/auth/RegisterView.vue"),
      },
    ],
  },
  {
    path: "/",
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "/dashboard",
        name: "dashboard",
        component: () => import("@/views/dashboard/DashboardView.vue"),
      },
      {
        path: "/projects",
        name: "projects",
        component: () => import("@/views/projects/ProjectsView.vue"),
      },
      {
        path: "/projects/:id",
        component: () => import("@/views/projects/ProjectDetailView.vue"),
        children: [
          {
            path: "",
            name: "project-overview",
            component: () => import("@/views/projects/ProjectOverviewView.vue"),
          },
          {
            path: "board",
            name: "project-board",
            component: () => import("@/views/projects/ProjectBoardView.vue"),
          },
          {
            path: "tasks",
            name: "project-tasks",
            component: () => import("@/views/projects/ProjectTasksView.vue"),
          },
          {
            path: "members",
            name: "project-members",
            component: () => import("@/views/projects/ProjectMembersView.vue"),
          },
        ],
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (auth.token && !auth.user) await auth.fetchMe();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "dashboard" };
  }
});

export default router;
