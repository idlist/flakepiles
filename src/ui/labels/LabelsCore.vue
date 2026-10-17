<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileLabelsRef } from '@/ui/FlakepileApp.vue'
import { inject, onUnmounted, ref, watch } from 'vue'
import LabelsItem from './LabelsItem.vue'
import LabelsTitle from './LabelsTitle.vue'

const plugin = inject('plugin') as FlakepilePluginRef
const labels = inject('labels') as FlakepileLabelsRef

export type LabelEditingState = 'idle' | 'name' | 'color'

const more = ref(false)
const editType = ref<LabelEditingState>('idle')
const labelUnderEdit = ref<string | null>(null)

function resetEditingState() {
  editType.value = 'idle'
  labelUnderEdit.value = null
}

watch(more, (val) => {
  if (!val) resetEditingState()
})

onUnmounted(() => {
  more.value = false
  resetEditingState()
})

function updateEditingState(type: LabelEditingState, id: string) {
  editType.value = type
  labelUnderEdit.value = id
}

function deleteLabel(id: string) {
  plugin.deleteLabel(id)
}
</script>

<template>
  <div class="labels-core">
    <LabelsTitle v-model:more="more" />

    <div class="labels-list">
      <LabelsItem
        v-for="label of labels"
        :key="label.id"
        :label="label"
        :more="more"
        :state="label.id === labelUnderEdit ? editType : 'idle'"
        @edit="updateEditingState"
        @finish="resetEditingState"
        @delete="deleteLabel"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.labels-core {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content 1fr;
  row-gap: var(--size-4-1);
}

.labels-list {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: var(--size-4-1);

  overflow-y: auto;
}
</style>
