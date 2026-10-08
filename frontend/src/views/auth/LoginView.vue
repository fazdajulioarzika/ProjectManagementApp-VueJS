<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = ref({ email: "", password: "" });
const error = ref("");

async function submit() {
  error.value = "";
  try {
    await auth.login(form.value);
    router.push(route.query.redirect || "/dashboard");
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <form
      @submit.prevent="submit"
      class="bg-white p-6 rounded-lg shadow w-80 space-y-3"
    >
      <h1 class="text-xl font-bold">Login TaskFlow</h1>
      <input
        v-model="form.email"
        type="email"
        placeholder="Email"
        class="w-full border rounded px-3 py-2"
      />
      <input
        v-model="form.password"
        type="password"
        placeholder="Password"
        class="w-full border rounded px-3 py-2"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button
        class="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700"
      >
        Masuk
      </button>
    </form>
  </div>
</template>
