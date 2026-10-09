<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const auth = useAuthStore();
const toast = useToast();

const empty = () => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const form = ref(empty());
const error = ref("");
const saving = ref(false);

async function submit() {
  error.value = "";

  if (form.value.newPassword !== form.value.confirmPassword) {
    error.value = "Konfirmasi password baru tidak sama";
    return;
  }

  saving.value = true;
  try {
    await auth.changePassword({
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword,
    });
    form.value = empty();
    toast.success("Password berhasil diubah");
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-sm text-gray-500">Keamanan akun Anda.</p>
    </div>

    <form
      class="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      @submit.prevent="submit"
    >
      <h2 class="font-semibold text-gray-900">Ubah Password</h2>

      <BaseInput
        v-model="form.currentPassword"
        label="Password Saat Ini"
        type="password"
        autocomplete="current-password"
        required
      />
      <BaseInput
        v-model="form.newPassword"
        label="Password Baru"
        type="password"
        placeholder="Minimal 6 karakter"
        autocomplete="new-password"
        required
      />
      <BaseInput
        v-model="form.confirmPassword"
        label="Konfirmasi Password Baru"
        type="password"
        autocomplete="new-password"
        required
      />

      <p
        v-if="error"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
      >
        {{ error }}
      </p>

      <div class="flex justify-end">
        <BaseButton type="submit" :loading="saving">{{
          saving ? "Menyimpan..." : "Ubah Password"
        }}</BaseButton>
      </div>
    </form>
  </div>
</template>
