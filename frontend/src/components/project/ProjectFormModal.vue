<script setup>
import { ref, computed, watch } from "vue";
import { useProjectStore } from "@/stores/project";
import { PROJECT_STATUS, toOptions } from "@/utils/constants";
import { toDateInput } from "@/utils/format";
import BaseModal from "@/components/ui/BaseModal.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import BaseTextarea from "@/components/ui/BaseTextarea.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const props = defineProps({ open: Boolean, project: Object });
const emit = defineEmits(["close", "saved"]);

const store = useProjectStore();
const statusOptions = toOptions(PROJECT_STATUS);

const isEdit = computed(() => !!props.project);
const form = ref({});
const error = ref("");
const saving = ref(false);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    error.value = "";
    const p = props.project;
    form.value = p
      ? {
          name: p.name,
          description: p.description,
          status: p.status,
          startDate: toDateInput(p.startDate),
          endDate: toDateInput(p.endDate),
        }
      : {
          name: "",
          description: "",
          status: "planning",
          startDate: new Date().toISOString().slice(0, 10),
          endDate: "",
        };
  },
  { immediate: true }
);

async function submit() {
  error.value = "";
  saving.value = true;
  try {
    // string kosong tidak lolos validasi backend, jadi diubah dulu
    const payload = {
      ...form.value,
      startDate: form.value.startDate || undefined,
      endDate: form.value.endDate || null,
    };
    const result = isEdit.value
      ? await store.update(props.project._id, payload)
      : await store.create(payload);
    emit("saved", result);
    emit("close");
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="isEdit ? 'Edit Project' : 'Buat Project Baru'"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        v-model="form.name"
        label="Nama Project"
        placeholder="Contoh: HRIS Development"
        required
      />
      <BaseTextarea
        v-model="form.description"
        label="Deskripsi"
        placeholder="Jelaskan project ini"
      />
      <BaseSelect
        v-model="form.status"
        label="Status"
        :options="statusOptions"
      />
      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.startDate" label="Tanggal Mulai" type="date" />
        <BaseInput v-model="form.endDate" label="Tanggal Selesai" type="date" />
      </div>

      <p
        v-if="error"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
      >
        {{ error }}
      </p>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" @click="emit('close')"
          >Batal</BaseButton
        >
        <BaseButton type="submit" :loading="saving">{{
          saving ? "Menyimpan..." : "Simpan"
        }}</BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
