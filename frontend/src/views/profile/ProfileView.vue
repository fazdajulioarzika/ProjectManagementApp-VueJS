<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import { resizeImage } from "@/utils/image";
import { formatDate } from "@/utils/format";
import UserAvatar from "@/components/ui/UserAvatar.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const auth = useAuthStore();
const toast = useToast();

const form = ref({ name: auth.user.name, avatar: auth.user.avatar || "" });
const fileInput = ref(null);
const error = ref("");
const saving = ref(false);

const dirty = computed(
  () =>
    form.value.name !== auth.user.name ||
    form.value.avatar !== (auth.user.avatar || "")
);

async function onFile(e) {
  const file = e.target.files[0];
  e.target.value = ""; // agar file yang sama bisa dipilih lagi
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    error.value = "File harus berupa gambar";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = "Ukuran gambar maksimal 5 MB";
    return;
  }

  error.value = "";
  try {
    form.value.avatar = await resizeImage(file);
  } catch (err) {
    error.value = err.message;
  }
}

async function submit() {
  error.value = "";
  saving.value = true;
  try {
    await auth.updateProfile({
      name: form.value.name,
      avatar: form.value.avatar,
    });
    toast.success("Profile berhasil diperbarui");
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
      <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
      <p class="text-sm text-gray-500">Kelola informasi akun Anda.</p>
    </div>

    <form
      class="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
      @submit.prevent="submit"
    >
      <div class="flex items-center gap-5">
        <UserAvatar :name="form.name" :avatar="form.avatar" size="xl" />
        <div class="space-y-2">
          <div class="flex gap-2">
            <BaseButton variant="secondary" @click="fileInput.click()"
              >Ganti Foto</BaseButton
            >
            <BaseButton
              v-if="form.avatar"
              variant="secondary"
              @click="form.avatar = ''"
              >Hapus</BaseButton
            >
          </div>
          <p class="text-xs text-gray-500">
            JPG, PNG, atau WebP. Maksimal 5 MB.
          </p>
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="hidden"
            @change="onFile"
          />
        </div>
      </div>

      <BaseInput v-model="form.name" label="Nama" required />
      <BaseInput :model-value="auth.user.email" label="Email" disabled />

      <dl class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-gray-500">Role</dt>
          <dd class="font-medium capitalize text-gray-900">
            {{ auth.user.role }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Bergabung sejak</dt>
          <dd class="font-medium text-gray-900">
            {{ formatDate(auth.user.createdAt) }}
          </dd>
        </div>
      </dl>

      <p
        v-if="error"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
      >
        {{ error }}
      </p>

      <div class="flex justify-end">
        <BaseButton type="submit" :loading="saving || !dirty">
          {{ saving ? "Menyimpan..." : "Simpan Perubahan" }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
