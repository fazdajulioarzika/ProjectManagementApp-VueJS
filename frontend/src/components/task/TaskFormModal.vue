<script setup>
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTaskStore } from "@/stores/task";
import { TASK_STATUS, TASK_PRIORITY, toOptions } from "@/utils/constants";
import { toDateInput } from "@/utils/format";
import BaseModal from "@/components/ui/BaseModal.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import BaseTextarea from "@/components/ui/BaseTextarea.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const props = defineProps({
  open: Boolean,
  task: Object,
  projectId: String,
  members: { type: Array, default: () => [] }, // [{ _id, name }]
  canManage: Boolean,
});
const emit = defineEmits(["close"]);

const auth = useAuthStore();
const store = useTaskStore();

const statusOptions = toOptions(TASK_STATUS);
const priorityOptions = toOptions(TASK_PRIORITY);
const assigneeOptions = computed(() => [
  { value: "", label: "Belum ditugaskan" },
  ...props.members.map((m) => ({ value: m._id, label: m.name })),
]);

const isEdit = computed(() => !!props.task);
const isAssignee = computed(
  () => !!props.task?.assignee && props.task.assignee._id === auth.user?._id
);
const fullAccess = computed(() => !isEdit.value || props.canManage);
const limitedAccess = computed(
  () => isEdit.value && !props.canManage && isAssignee.value
);
const readOnly = computed(() => !fullAccess.value && !limitedAccess.value);
const canEditStatus = computed(() => fullAccess.value || limitedAccess.value);

const form = ref({});
const error = ref("");
const saving = ref(false);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    error.value = "";
    const t = props.task;
    form.value = t
      ? {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee?._id ?? "",
          dueDate: toDateInput(t.dueDate),
        }
      : {
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          assignee: "",
          dueDate: "",
        };
  },
  { immediate: true }
);

async function submit() {
  error.value = "";
  saving.value = true;
  try {
    const f = form.value;
    const payload = fullAccess.value
      ? {
          title: f.title,
          description: f.description,
          status: f.status,
          priority: f.priority,
          assignee: f.assignee || null,
          dueDate: f.dueDate || null,
        }
      : { description: f.description, status: f.status };

    if (isEdit.value) await store.update(props.task._id, payload);
    else await store.create(props.projectId, payload);
    emit("close");
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!confirm("Hapus task ini?")) return;
  try {
    await store.remove(props.task._id);
    emit("close");
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="isEdit ? 'Detail Task' : 'Task Baru'"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        v-model="form.title"
        label="Judul"
        placeholder="Judul task"
        :disabled="!fullAccess"
        required
      />
      <BaseTextarea
        v-model="form.description"
        label="Deskripsi"
        :disabled="readOnly"
      />

      <div class="grid grid-cols-2 gap-4">
        <BaseSelect
          v-model="form.status"
          label="Status"
          :options="statusOptions"
          :disabled="!canEditStatus"
        />
        <BaseSelect
          v-model="form.priority"
          label="Priority"
          :options="priorityOptions"
          :disabled="!fullAccess"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseSelect
          v-model="form.assignee"
          label="Assigned To"
          :options="assigneeOptions"
          :disabled="!fullAccess"
        />
        <BaseInput
          v-model="form.dueDate"
          label="Due Date"
          type="date"
          :disabled="!fullAccess"
        />
      </div>

      <p v-if="limitedAccess" class="text-xs text-gray-500">
        Sebagai anggota, Anda hanya dapat mengubah deskripsi dan status task
        ini.
      </p>
      <p v-if="readOnly" class="text-xs text-gray-500">
        Task ini tidak ditugaskan kepada Anda, jadi hanya bisa dilihat.
      </p>

      <p
        v-if="error"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
      >
        {{ error }}
      </p>

      <div class="flex items-center justify-between pt-2">
        <BaseButton v-if="isEdit && canManage" variant="danger" @click="remove"
          >Hapus</BaseButton
        >
        <span v-else />

        <div class="flex gap-2">
          <BaseButton variant="secondary" @click="emit('close')">{{
            readOnly ? "Tutup" : "Batal"
          }}</BaseButton>
          <BaseButton v-if="!readOnly" type="submit" :loading="saving">
            {{ saving ? "Menyimpan..." : "Simpan" }}
          </BaseButton>
        </div>
      </div>
    </form>
  </BaseModal>
</template>
