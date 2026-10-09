<script setup>
import { ref, computed, watch } from "vue";
import userService from "@/services/user";
import { useProjectStore } from "@/stores/project";
import BaseModal from "@/components/ui/BaseModal.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const props = defineProps({
  open: Boolean,
  projectId: String,
  existingIds: { type: Array, default: () => [] },
});
const emit = defineEmits(["close"]);

const store = useProjectStore();
const search = ref("");
const results = ref([]);
const selected = ref(null);
const title = ref("");
const loading = ref(false);
const saving = ref(false);
const error = ref("");
let timer;

const available = computed(() =>
  results.value.filter((u) => !props.existingIds.includes(u._id))
);

async function load() {
  loading.value = true;
  try {
    results.value = await userService.search(search.value);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    search.value = "";
    selected.value = null;
    title.value = "";
    error.value = "";
    load();
  }
);

// Cari ke server 300ms setelah user berhenti mengetik
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(load, 300);
});

async function submit() {
  if (!selected.value) {
    error.value = "Pilih user terlebih dahulu";
    return;
  }
  error.value = "";
  saving.value = true;
  try {
    await store.addMember(props.projectId, {
      user: selected.value._id,
      title: title.value || undefined,
    });
    emit("close");
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal :open="open" title="Tambah Anggota" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        v-model="search"
        label="Cari user"
        placeholder="Nama atau email"
      />

      <ul
        class="max-h-52 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200"
      >
        <li v-if="loading" class="px-3 py-3 text-sm text-gray-500">
          Mencari...
        </li>
        <li
          v-else-if="!available.length"
          class="px-3 py-3 text-sm text-gray-500"
        >
          Tidak ada user yang bisa ditambahkan.
        </li>
        <li
          v-for="u in available"
          v-else
          :key="u._id"
          class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
          :class="selected?._id === u._id && 'bg-indigo-50'"
          @click="selected = u"
        >
          <div>
            <p class="font-medium text-gray-900">{{ u.name }}</p>
            <p class="text-gray-500">{{ u.email }}</p>
          </div>
          <span class="text-xs capitalize text-gray-400">{{ u.role }}</span>
        </li>
      </ul>

      <BaseInput
        v-model="title"
        label="Jabatan di project"
        placeholder="Contoh: Frontend Developer"
      />

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
          saving ? "Menambah..." : "Tambahkan"
        }}</BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
