<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import taskService from "@/services/task";
import { useTaskFilters } from "@/composables/useTaskFilters";
import { formatDate, isOverdue } from "@/utils/format";
import StatusBadge from "@/components/task/StatusBadge.vue";
import PriorityBadge from "@/components/task/PriorityBadge.vue";
import TaskFilters from "@/components/task/TaskFilters.vue";

const auth = useAuthStore();
const router = useRouter();

const tasks = ref([]);
const loading = ref(true);
const error = ref("");

const { filters, filtered, active, reset } = useTaskFilters(tasks);

// Member langsung melihat tugasnya sendiri, tetap bisa diubah lewat filter
if (auth.user.role === "member") filters.value.assignee = auth.user._id;

const assignees = computed(() => {
  const map = new Map();
  map.set(auth.user._id, {
    _id: auth.user._id,
    name: `${auth.user.name} (saya)`,
  });
  tasks.value.forEach((t) => {
    if (t.assignee && !map.has(t.assignee._id))
      map.set(t.assignee._id, t.assignee);
  });
  return [...map.values()];
});

onMounted(async () => {
  try {
    tasks.value = await taskService.listAll();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

function openTask(t) {
  router.push({
    name: "project-tasks",
    params: { id: t.project._id },
    query: { task: t._id },
  });
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
      <p class="text-sm text-gray-500">
        Semua task dari project yang Anda ikuti.
      </p>
    </div>

    <p v-if="loading" class="text-gray-500">Memuat task...</p>
    <p
      v-else-if="error"
      class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </p>

    <template v-else>
      <TaskFilters
        v-model="filters"
        :assignees="assignees"
        :active="active"
        @reset="reset"
      />

      <div
        v-if="!filtered.length"
        class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500"
      >
        {{
          tasks.length
            ? "Tidak ada task yang cocok dengan filter."
            : "Belum ada task."
        }}
      </div>

      <div
        v-else
        class="overflow-x-auto rounded-xl border border-gray-200 bg-white"
      >
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th class="px-4 py-3 font-medium">Task</th>
              <th class="px-4 py-3 font-medium">Project</th>
              <th class="px-4 py-3 font-medium">Priority</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Assignee</th>
              <th class="px-4 py-3 font-medium">Due</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="t in filtered"
              :key="t._id"
              class="cursor-pointer hover:bg-gray-50"
              @click="openTask(t)"
            >
              <td class="px-4 py-3 font-medium text-gray-900">{{ t.title }}</td>
              <td class="px-4 py-3 text-gray-600">{{ t.project?.name }}</td>
              <td class="px-4 py-3">
                <PriorityBadge :priority="t.priority" />
              </td>
              <td class="px-4 py-3"><StatusBadge :status="t.status" /></td>
              <td class="px-4 py-3 text-gray-600">
                {{ t.assignee?.name ?? "-" }}
              </td>
              <td
                class="whitespace-nowrap px-4 py-3"
                :class="
                  isOverdue(t) ? 'font-medium text-red-600' : 'text-gray-600'
                "
              >
                {{ formatDate(t.dueDate) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="active && filtered.length" class="text-xs text-gray-500">
        Menampilkan {{ filtered.length }} dari {{ tasks.length }} task.
      </p>
    </template>
  </div>
</template>
