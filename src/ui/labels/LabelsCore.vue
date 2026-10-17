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

const idDragging = ref<string | null>(null)
const slotToDrop = ref<number | null>(null)

function resetDragging() {
  idDragging.value = null
  slotToDrop.value = null
}

function dragOverSlot(event: DragEvent, slot: number) {
  event.preventDefault()

  if (idDragging.value === null) return
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'

  slotToDrop.value = slot
}

function dragOverSlotOnLabel(event: DragEvent, index: number) {
  const $element = event.currentTarget as HTMLElement
  const rect = $element.getBoundingClientRect()
  const above = event.clientY < rect.top + rect.height / 2

  dragOverSlot(event, above ? index : index + 1)
}

function dropLabel(event: DragEvent) {
  event.preventDefault()

  if (idDragging.value != null && slotToDrop.value != null) {
    plugin.updateLabelOrder(idDragging.value, slotToDrop.value)
  }

  resetDragging()
}

function isSlotActive(index: number) {
  return { '-active': slotToDrop.value === index }
}
</script>

<template>
  <div class="labels-core">
    <LabelsTitle v-model:more="more" />

    <div class="labels-list" @dragend="resetDragging" @drop="dropLabel">
      <div v-for="(label, index) of labels" :key="label.id">
        <div
          :class="['labels-dropping-line-before', isSlotActive(index)]"
          @dragover="(e) => dragOverSlot(e, index)"
        >
        </div>

        <div @dragover="(e) => dragOverSlotOnLabel(e, index)">
          <LabelsItem
            :label="label"
            :more="more"
            :state="label.id === labelUnderEdit ? editType : 'idle'"
            :is-dragging="idDragging === label.id"
            @edit="updateEditingState"
            @finish="resetEditingState"
            @delete="deleteLabel"
            @dragstart="(id) => idDragging = id"
          />
        </div>

        <div
          :class="['labels-dropping-line-after', isSlotActive(index + 1)]"
          @dragover="(e) => dragOverSlot(e, index + 1)"
        >
        </div>
      </div>
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
  padding: var(--size-2-1) 0;

  overflow-y: auto;
}

.labels-dropping-line-before {
  height: var(--size-2-1);

  &.-active {
    position: relative;
  }

  &.-active::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--size-2-1) * -0.5);
    height: var(--size-2-1);
    border-radius: calc(var(--size-2-1) * 0.5);
    background-color: var(--color-accent);
  }
}

.labels-dropping-line-after {
  height: var(--size-2-1);

  &.-active {
    position: relative;
  }

  &.-active::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(var(--size-2-1) * -0.5);
    height: var(--size-2-1);
    border-radius: calc(var(--size-2-1) * 0.5);
    background-color: var(--color-accent);
  }
}
</style>
