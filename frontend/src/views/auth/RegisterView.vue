<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { useSlowHint } from "@/composables/useSlowHint";

const { slow, start, stop } = useSlowHint();

const auth = useAuthStore();
const router = useRouter();

const form = ref({ name: "", email: "", password: "", confirmPassword: "" });
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";

  if (form.value.password !== form.value.confirmPassword) {
    error.value = "Konfirmasi password tidak sama";
    return;
  }

  loading.value = true;
  start();
  try {
    const { name, email, password } = form.value;
    await auth.register({ name, email, password });
    router.push("/dashboard");
  } catch (e) {
    error.value = e.message;
  } finally {
    stop();
    loading.value = false;
  }
}
</script>

<template>
  <h2 class="mb-6 text-xl font-semibold text-gray-900">Buat akun baru</h2>

  <form class="space-y-4" @submit.prevent="submit">
    <BaseInput
      v-model="form.name"
      label="Nama"
      placeholder="Nama lengkap"
      autocomplete="name"
      required
    />
    <BaseInput
      v-model="form.email"
      label="Email"
      type="email"
      placeholder="nama@email.com"
      autocomplete="email"
      required
    />
    <BaseInput
      v-model="form.password"
      label="Password"
      type="password"
      placeholder="Minimal 6 karakter"
      autocomplete="new-password"
      required
    />
    <BaseInput
      v-model="form.confirmPassword"
      label="Konfirmasi Password"
      type="password"
      autocomplete="new-password"
      required
    />

    <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
      {{ error }}
    </p>
    <p
      v-if="slow"
      class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
    >
      Server sedang bangun karena lama tidak dipakai. Mohon tunggu sampai 1
      menit...
    </p>

    <BaseButton type="submit" :loading="loading" class="w-full">
      {{ loading ? "Memproses..." : "Daftar" }}
    </BaseButton>
  </form>

  <p class="mt-6 text-center text-sm text-gray-500">
    Sudah punya akun?
    <RouterLink to="/login" class="font-medium text-indigo-600 hover:underline"
      >Masuk</RouterLink
    >
  </p>
</template>
