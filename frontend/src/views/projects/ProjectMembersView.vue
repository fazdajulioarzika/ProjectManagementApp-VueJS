<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { UserPlus, Trash2 } from "lucide-vue-next";
import { useProjectStore } from "@/stores/project";
import { useTaskStore } from "@/stores/task";
import { useToast } from "@/composables/useToast";
import BaseButton from "@/components/ui/BaseButton.vue";
import AddMemberModal from "@/components/project/AddMemberModal.vue";

const route = useRoute();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const toast = useToast();

const showAdd = ref(false);
const members = computed(() => projectStore.current?.members ?? []);
const existingIds = computed(() => members.value.map((m) => m.user._id));
const isOwner = (m) => m.user._id === projectStore.current.owner._id;

async function remove(m) {
  if (
    !confirm(
      `Keluarkan ${m.user.name} dari project? Task miliknya akan menjadi belum ditugaskan.`
    )
  )
    return;
  try {
    await projectStore.removeMember(route.params.id, m.user._id);
    await taskStore.fetchByProject(route.params.id); // assignee task berubah
    toast.success("Anggota dikeluarkan");
  } catch (e) {
    toast.error(e.message);
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <BaseButton v-if="projectStore.canManage" @click="showAdd = true">
        <UserPlus class="h-4 w-4" /> Tambah Anggota
      </BaseButton>
    </div>

    <ul
      class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white"
    >
      <li
        v-for="m in members"
        :key="m.user._id"
        class="flex items-center justify-between gap-3 px-5 py-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700"
          >
            {{ m.user.name.charAt(0).toUpperCase() }}
          </div>
          <div class="text-sm leading-tight">
            <p class="font-medium text-gray-900">
              {{ m.user.name }}
              <span
                v-if="isOwner(m)"
                class="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-600"
                >Owner</span
              >
            </p>
            <p class="text-gray-500">{{ m.title }} · {{ m.user.email }}</p>
          </div>
        </div>

        <button
          v-if="projectStore.canManage && !isOwner(m)"
          class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Keluarkan"
          @click="remove(m)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </li>
    </ul>

    <AddMemberModal
      :open="showAdd"
      :project-id="route.params.id"
      :existing-ids="existingIds"
      @close="showAdd = false"
    />
  </div>
</template>
