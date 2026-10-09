<script setup>
import { ref, watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import userService from "@/services/user";
import { formatDate } from "@/utils/format";
import UserAvatar from "@/components/ui/UserAvatar.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";

const auth = useAuthStore();
const toast = useToast();

const users = ref([]);
const search = ref("");
const loading = ref(true);
const error = ref("");
const roleVersion = ref(0); // dinaikkan saat gagal, supaya <select> kembali ke nilai semula

const roleOptions = [
  { value: "member", label: "Member" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];
const roleClass = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-indigo-100 text-indigo-700",
  member: "bg-gray-100 text-gray-700",
};

async function load() {
  loading.value = true;
  error.value = "";
  try {
    users.value = await userService.search(search.value);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

let timer;
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(load, 300);
});
onMounted(load);

async function changeRole(u, role) {
  if (role === u.role) return;
  try {
    const updated = await userService.updateRole(u._id, role);
    users.value = users.value.map((x) =>
      x._id === u._id ? { ...x, role: updated.role } : x
    );
    toast.success(`Role ${u.name} diubah menjadi ${updated.role}`);
  } catch (e) {
    roleVersion.value++;
    toast.error(e.message);
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Members</h1>
      <p class="text-sm text-gray-500">
        {{
          auth.isAdmin
            ? "Kelola user dan role mereka."
            : "Daftar user di TaskFlow."
        }}
      </p>
    </div>

    <div class="max-w-sm">
      <BaseInput v-model="search" placeholder="Cari nama atau email..." />
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ error }}
    </p>
    <p v-else-if="loading" class="text-gray-500">Memuat user...</p>
    <p v-else-if="!users.length" class="text-gray-500">
      Tidak ada user yang cocok.
    </p>

    <div
      v-else
      class="overflow-x-auto rounded-xl border border-gray-200 bg-white"
    >
      <table class="w-full text-left text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">User</th>
            <th class="px-4 py-3 font-medium">Role</th>
            <th class="px-4 py-3 font-medium">Bergabung</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in users" :key="u._id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <UserAvatar :name="u.name" :avatar="u.avatar" />
                <div class="leading-tight">
                  <p class="font-medium text-gray-900">{{ u.name }}</p>
                  <p class="text-gray-500">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div v-if="auth.isAdmin && u._id !== auth.user._id" class="w-32">
                <BaseSelect
                  :key="`${u._id}-${roleVersion}`"
                  :model-value="u.role"
                  :options="roleOptions"
                  @update:model-value="changeRole(u, $event)"
                />
              </div>
              <span
                v-else
                class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                :class="roleClass[u.role]"
              >
                {{ u.role }}
              </span>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-gray-600">
              {{ formatDate(u.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-gray-500">
      Menampilkan maksimal 50 user. Gunakan pencarian untuk menyaring.
    </p>
  </div>
</template>
