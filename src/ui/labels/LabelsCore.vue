<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileLabelsRef } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/use.ts'
import { useEventListener } from '@vueuse/core'
import { inject, onUnmounted, ref, watch } from 'vue'
import LabelsItem from './LabelsItem.vue'
import LabelsTitle from './LabelsTitle.vue'

const plugin = inject('plugin') as FlakepilePluginRef
const labels = inject('labels') as FlakepileLabelsRef

export type LabelEditingState = 'idle' | 'name' | 'color'

const more = ref(false)
const editType = ref<LabelEditingState>('idle')
const labelUnderEdit = ref<string | null>(null)

/* Label Management */

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

/* Label Ordering By Dragging */

const idDragging = ref<string | null>(null)
const slotToDrop = ref<number | null>(null)
const rowsMap = new Map<string, HTMLDivElement>()

function updateRowsMap($element: HTMLDivElement | null, id: string) {
  if ($element == null) {
    rowsMap.delete(id)
  } else {
    rowsMap.set(id, $element as HTMLDivElement)
  }
}

useEventListener('pointermove', onPointerMove)
useEventListener('pointerup', onPointerUp)
useEventListener('pointercancel', onPointerCancel)

function resetDragging() {
  idDragging.value = null
  slotToDrop.value = null
}

function tryDetermineSlot(y: number): number | null {
  let slot: number | null = null

  for (let i = 0; i < labels.value.length; i++) {
    const label = labels.value[i]!
    const $element = rowsMap.get(label.id)
    if (!$element) continue

    const rect = $element.getBoundingClientRect()
    const top = rect.top
    const middle = rect.top + rect.height / 2
    const bottom = rect.top + rect.height

    if (y >= top && y < middle) {
      slot = i
      break
    }
    if (y >= middle && y < bottom) {
      slot = i + 1
      break
    }
  }

  return slot
}

function startReorder(id: string) {
  idDragging.value = id
}

function onPointerMove(event: PointerEvent) {
  if (idDragging.value == null) return

  const slot = tryDetermineSlot(event.y)
  slotToDrop.value = slot
}

function onPointerUp() {
  if (idDragging.value == null) return

  if (slotToDrop.value != null) {
    plugin.updateLabelOrder(idDragging.value, slotToDrop.value)
  }

  resetDragging()
}

function onPointerCancel() {
  if (idDragging.value == null) return
  resetDragging()
}

function isSlotActive(index: number) {
  return { '-active': slotToDrop.value === index }
}
</script>

<template>
  <div class="labels-core">
    <LabelsTitle v-model:more="more" />

    <div class="labels-list">
      <div
        v-for="(label, index) of labels"
        :key="label.id"
        :ref="($el) => updateRowsMap($el as HTMLDivElement | null, label.id)"
      >
        <div :class="['labels-dropping-line-before', isSlotActive(index)]"></div>

        <LabelsItem
          :label="label"
          :more="more"
          :state="label.id === labelUnderEdit ? editType : 'idle'"
          :is-dragging="label.id === idDragging"
          @edit="updateEditingState"
          @finish="resetEditingState"
          @delete="deleteLabel"
          @reorder="startReorder"
        />

        <div :class="['labels-dropping-line-after', isSlotActive(index + 1)]"></div>
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

%labels-dropping-line {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: var(--size-2-1);
  border-radius: calc(var(--size-2-1) * 0.5);
  background-color: var(--color-accent);
}

.labels-dropping-line-before {
  height: var(--size-2-1);

  &.-active {
    position: relative;
  }

  &.-active::before {
    @extend %labels-dropping-line;
    top: calc(var(--size-2-1) * -0.5);
  }
}

.labels-dropping-line-after {
  height: var(--size-2-1);

  &.-active {
    position: relative;
  }

  &.-active::after {
    @extend %labels-dropping-line;
    bottom: calc(var(--size-2-1) * -0.5);
  }
}
</style>
