<script setup>
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import commentService from "@/services/comment";
import { timeAgo } from "@/utils/format";
import UserAvatar from "@/components/ui/UserAvatar.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const props = defineProps({ taskId: String });

const auth = useAuthStore();
const toast = useToast();

const comments = ref([]);
const loading = ref(false);
const newContent = ref("");
const posting = ref(false);
const editingId = ref(null);
const editContent = ref("");

const isOwn = (c) => c.user?._id === auth.user._id;
const canDelete = (c) => isOwn(c) || auth.isAdmin;

async function load() {
  loading.value = true;
  comments.value = [];
  editingId.value = null;
  try {
    comments.value = await commentService.list(props.taskId);
  } catch (e) {
    toast.error(e.message);
  } finally {
    loading.value = false;
  }
}

watch(() => props.taskId, load, { immediate: true });

async function add() {
  const content = newContent.value.trim();
  if (!content) return;
  posting.value = true;
  try {
    comments.value.push(await commentService.create(props.taskId, content));
    newContent.value = "";
  } catch (e) {
    toast.error(e.message);
  } finally {
    posting.value = false;
  }
}

function startEdit(c) {
  editingId.value = c._id;
  editContent.value = c.content;
}

async function saveEdit(c) {
  const content = editContent.value.trim();
  if (!content) return;
  try {
    const updated = await commentService.update(c._id, content);
    comments.value = comments.value.map((x) => (x._id === c._id ? updated : x));
    editingId.value = null;
  } catch (e) {
    toast.error(e.message);
  }
}

async function remove(c) {
  if (!confirm("Hapus komentar ini?")) return;
  try {
    await commentService.remove(c._id);
    comments.value = comments.value.filter((x) => x._id !== c._id);
  } catch (e) {
    toast.error(e.message);
  }
}
</script>

<template>
  <section class="mt-6 border-t border-gray-200 pt-4">
    <h4 class="mb-3 text-sm font-semibold text-gray-900">
      Comments ({{ comments.length }})
    </h4>

    <p v-if="loading" class="text-sm text-gray-500">Memuat komentar...</p>
    <p v-else-if="!comments.length" class="text-sm text-gray-500">
      Belum ada komentar.
    </p>

    <ul v-else class="mb-4 max-h-64 space-y-4 overflow-y-auto pr-1">
      <li v-for="c in comments" :key="c._id" class="flex gap-3">
        <UserAvatar :name="c.user?.name" :avatar="c.user?.avatar" size="sm" />
        <div class="min-w-0 flex-1 text-sm">
          <p class="font-medium text-gray-900">
            {{ c.user?.name }}
            <span class="ml-1 text-xs font-normal text-gray-400">
              {{ timeAgo(c.createdAt)
              }}<template v-if="c.updatedAt !== c.createdAt">
                · diedit</template
              >
            </span>
          </p>

          <div v-if="editingId === c._id" class="mt-1 space-y-2">
            <textarea
              v-model="editContent"
              rows="2"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div class="flex gap-2">
              <BaseButton @click="saveEdit(c)">Simpan</BaseButton>
              <BaseButton variant="secondary" @click="editingId = null"
                >Batal</BaseButton
              >
            </div>
          </div>

          <template v-else>
            <p class="whitespace-pre-line break-words text-gray-700">
              {{ c.content }}
            </p>
            <div class="mt-1 flex gap-3 text-xs text-gray-400">
              <button
                v-if="isOwn(c)"
                class="hover:text-indigo-600"
                @click="startEdit(c)"
              >
                Edit
              </button>
              <button
                v-if="canDelete(c)"
                class="hover:text-red-600"
                @click="remove(c)"
              >
                Hapus
              </button>
            </div>
          </template>
        </div>
      </li>
    </ul>

    <div class="space-y-2">
      <textarea
        v-model="newContent"
        rows="2"
        placeholder="Tulis komentar..."
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <div class="flex justify-end">
        <BaseButton :loading="posting" @click="add">{{
          posting ? "Mengirim..." : "Kirim"
        }}</BaseButton>
      </div>
    </div>
  </section>
</template>
