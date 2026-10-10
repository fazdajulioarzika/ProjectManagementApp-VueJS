<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import taskService from "@/services/task";
import projectService from "@/services/project";
import { TASK_PRIORITY } from "@/utils/constants";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import PriorityBadge from "@/components/task/PriorityBadge.vue";
import StatusBadge from "@/components/task/StatusBadge.vue";

const router = useRouter();

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const today = new Date();
const todayKey = keyOf(today);
const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const weight = { urgent: 0, high: 1, medium: 2, low: 3 };
const dot = {
  low: "bg-gray-400",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const month = ref(new Date(today.getFullYear(), today.getMonth(), 1));
const selectedKey = ref(todayKey);
const projectId = ref("");
const projects = ref([]);
const tasks = ref([]);
const loading = ref(false);
const error = ref("");
let requestId = 0; // mencegah respons lama menimpa respons yang lebih baru

// Grid kalender: minggu dimulai Senin, diisi sampai penuh 7 kolom
const days = computed(() => {
  const first = month.value;
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0
  ).getDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;

  return Array.from({ length: total }, (_, i) => {
    const date = new Date(
      first.getFullYear(),
      first.getMonth(),
      1 - offset + i
    );
    return {
      date,
      key: keyOf(date),
      inMonth: date.getMonth() === first.getMonth(),
    };
  });
});

const monthTitle = computed(() =>
  month.value.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
);

const projectOptions = computed(() => [
  { value: "", label: "Semua project" },
  ...projects.value.map((p) => ({ value: p._id, label: p.name })),
]);

const tasksByDay = computed(() => {
  const map = new Map();
  for (const t of tasks.value) {
    const key = keyOf(new Date(t.dueDate));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  map.forEach((list) =>
    list.sort(
      (a, b) =>
        weight[a.priority] - weight[b.priority] ||
        a.title.localeCompare(b.title)
    )
  );
  return map;
});

const tasksOn = (key) => tasksByDay.value.get(key) ?? [];
const selectedTasks = computed(() => tasksOn(selectedKey.value));
const selectedLabel = computed(() =>
  new Date(`${selectedKey.value}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
);

// Terlambat = belum selesai dan tanggalnya sudah lewat (hari ini belum dihitung)
const isLate = (task, key) => task.status !== "done" && key < todayKey;

async function load() {
  const id = ++requestId;
  loading.value = true;
  error.value = "";

  const first = days.value[0].date;
  const last = days.value[days.value.length - 1].date;
  try {
    const result = await taskService.listAll({
      from: first.toISOString(),
      to: new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() + 1
      ).toISOString(),
      project: projectId.value || undefined,
    });
    if (id === requestId) tasks.value = result;
  } catch (e) {
    if (id === requestId) error.value = e.message;
  } finally {
    if (id === requestId) loading.value = false;
  }
}

function shift(delta) {
  month.value = new Date(
    month.value.getFullYear(),
    month.value.getMonth() + delta,
    1
  );
}

function goToday() {
  month.value = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedKey.value = todayKey;
}

function openTask(task) {
  router.push({
    name: "project-tasks",
    params: { id: task.project._id },
    query: { task: task._id },
  });
}

// Saat pindah bulan, pilih tanggal yang valid di bulan itu
watch(month, (m) => {
  const isCurrent =
    m.getFullYear() === today.getFullYear() &&
    m.getMonth() === today.getMonth();
  selectedKey.value = isCurrent ? todayKey : keyOf(m);
});
watch([month, projectId], load);

onMounted(async () => {
  projects.value = await projectService.list().catch(() => []);
  load();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Calendar</h1>
        <p class="text-sm text-gray-500">
          Task berdasarkan tanggal deadline.
          <span v-if="loading" class="text-gray-400">Memuat...</span>
        </p>
      </div>
      <div class="w-56">
        <BaseSelect v-model="projectId" :options="projectOptions" />
      </div>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ error }}
    </p>

    <section class="rounded-xl border border-gray-200 bg-white p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">{{ monthTitle }}</h2>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
            aria-label="Bulan sebelumnya"
            @click="shift(-1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <BaseButton variant="secondary" @click="goToday">Hari ini</BaseButton>
          <button
            class="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
            aria-label="Bulan berikutnya"
            @click="shift(1)"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        class="grid grid-cols-7 overflow-hidden rounded-lg border-l border-t border-gray-200"
      >
        <div
          v-for="w in weekdays"
          :key="w"
          class="border-b border-r border-gray-200 bg-gray-50 py-2 text-center text-xs font-medium text-gray-500"
        >
          {{ w }}
        </div>

        <div
          v-for="d in days"
          :key="d.key"
          class="min-h-16 cursor-pointer border-b border-r border-gray-200 p-1 transition hover:bg-gray-50 sm:min-h-28 sm:p-1.5"
          :class="[
            !d.inMonth && 'bg-gray-50/60',
            selectedKey === d.key && 'ring-2 ring-inset ring-indigo-500',
          ]"
          @click="selectedKey = d.key"
        >
          <span
            class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
            :class="
              d.key === todayKey
                ? 'bg-indigo-600 text-white'
                : d.inMonth
                ? 'text-gray-700'
                : 'text-gray-400'
            "
          >
            {{ d.date.getDate() }}
          </span>

          <!-- Layar lebar: judul task -->
          <div class="mt-1 hidden space-y-1 sm:block">
            <button
              v-for="t in tasksOn(d.key).slice(0, 2)"
              :key="t._id"
              type="button"
              class="block w-full truncate rounded border-l-2 px-1.5 py-0.5 text-left text-xs"
              :class="[
                TASK_PRIORITY[t.priority].class,
                isLate(t, d.key) ? 'border-red-500' : 'border-transparent',
                t.status === 'done' && 'line-through opacity-50',
              ]"
              :title="`${t.title} (${t.project?.name})`"
              @click.stop="openTask(t)"
            >
              {{ t.title }}
            </button>
            <p
              v-if="tasksOn(d.key).length > 2"
              class="px-1 text-xs text-gray-500"
            >
              +{{ tasksOn(d.key).length - 2 }} lagi
            </p>
          </div>

          <!-- Layar kecil: titik penanda -->
          <div class="mt-1 flex flex-wrap gap-0.5 sm:hidden">
            <span
              v-for="t in tasksOn(d.key).slice(0, 4)"
              :key="t._id"
              class="h-1.5 w-1.5 rounded-full"
              :class="t.status === 'done' ? 'bg-green-500' : dot[t.priority]"
            />
          </div>
        </div>
      </div>

      <div
        class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500"
      >
        <span
          v-for="(p, key) in TASK_PRIORITY"
          :key="key"
          class="flex items-center gap-1.5"
        >
          <span class="h-2 w-2 rounded-full" :class="dot[key]" /> {{ p.label }}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-0.5 bg-red-500" /> Terlambat
        </span>
        <span>Task selesai dicoret dan dipudarkan</span>
      </div>
    </section>

    <section class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 font-semibold text-gray-900">{{ selectedLabel }}</h2>

      <p v-if="!selectedTasks.length" class="text-sm text-gray-500">
        Tidak ada task yang jatuh tempo di tanggal ini.
      </p>

      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="t in selectedTasks"
          :key="t._id"
          class="flex cursor-pointer flex-wrap items-center justify-between gap-2 py-3 hover:bg-gray-50"
          @click="openTask(t)"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ t.title }}</p>
            <p class="text-xs text-gray-500">
              {{ t.project?.name }} ·
              {{ t.assignee?.name ?? "Belum ditugaskan" }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <PriorityBadge :priority="t.priority" />
            <StatusBadge :status="t.status" />
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
