<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import activityService from "@/services/activity";
import { TASK_STATUS } from "@/utils/constants";
import { timeAgo } from "@/utils/format";
import UserAvatar from "@/components/ui/UserAvatar.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const route = useRoute();

const items = ref([]);
const page = ref(1);
const hasMore = ref(false);
const loading = ref(false);
const error = ref("");

const statusLabel = (s) => TASK_STATUS[s]?.label ?? s;

function describe(a) {
  const m = a.metadata || {};
  switch (a.action) {
    case "project.created":
      return `membuat project "${a.target}"`;
    case "project.updated":
      return `memperbarui project "${a.target}"`;
    case "member.added":
      return `menambahkan ${a.target} ke project`;
    case "member.removed":
      return `mengeluarkan ${a.target} dari project`;
    case "task.created":
      return `membuat task "${a.target}"`;
    case "task.moved":
      return `memindahkan "${a.target}" dari ${statusLabel(
        m.from
      )} → ${statusLabel(m.to)}`;
    case "task.completed":
      return `menyelesaikan "${a.target}"`;
    case "task.assigned":
      return `menugaskan "${a.target}" kepada ${m.assignee}`;
    case "task.deleted":
      return `menghapus task "${a.target}"`;
    case "comment.added":
      return `berkomentar di "${a.target}"`;
    default:
      return a.action;
  }
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await activityService.listByProject(
      route.params.id,
      page.value
    );
    items.value.push(...data.activities);
    hasMore.value = data.hasMore;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  page.value++;
  load();
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <p v-if="error" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ error }}
    </p>

    <div
      v-if="!loading && !items.length && !error"
      class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
    >
      Belum ada aktivitas.
    </div>

    <ul
      v-if="items.length"
      class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white"
    >
      <li
        v-for="a in items"
        :key="a._id"
        class="flex items-start gap-3 px-5 py-4"
      >
        <UserAvatar :name="a.user?.name" :avatar="a.user?.avatar" size="md" />
        <div class="text-sm">
          <p class="text-gray-700">
            <span class="font-medium text-gray-900">{{
              a.user?.name ?? "User dihapus"
            }}</span>
            {{ describe(a) }}
          </p>
          <p class="mt-0.5 text-xs text-gray-400">{{ timeAgo(a.createdAt) }}</p>
        </div>
      </li>
    </ul>

    <p v-if="loading" class="text-sm text-gray-500">Memuat aktivitas...</p>

    <div v-if="hasMore && !loading" class="flex justify-center">
      <BaseButton variant="secondary" @click="loadMore"
        >Muat lebih banyak</BaseButton
      >
    </div>
  </div>
</template>
