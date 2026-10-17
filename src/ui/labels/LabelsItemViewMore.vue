<script setup lang="ts">
import type { FlakeLabel } from '@/schemes/common'
import { useCssIf } from '@/use'
import { ObIcon } from '@/wrappers'
import { useTemplateRef } from 'vue'
import LabelsBadge from './LabelsBadge.vue'
import type { LabelEditingState } from './LabelsCore.vue'

const props = defineProps<{
  label: FlakeLabel
  state: LabelEditingState
  isDragging: boolean
}>()

const emit = defineEmits<{
  edit: [type: LabelEditingState, id: string]
  delete: [id: string]
  dragstart: [id: string]
}>()

const $item = useTemplateRef('$item')

function onDragStart(event: DragEvent) {
  if (!event.dataTransfer) return

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', props.label.id)

  if ($item.value) {
    $item.value.classList.add('fp-dragging')
    const rect = $item.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    event.dataTransfer.setDragImage($item.value!, x, y)
  }

  emit('dragstart', props.label.id)
}

function onDragEnd() {
  if ($item.value) {
    $item.value.classList.remove('fp-dragging')
  }
}

const ifColorUnderEdit = useCssIf(() => props.state === 'color', 'fp-invert')
</script>

<template>
  <div class="fp-labels-item" ref="$item">
    <div
      class="fp-btn-icon fp-grabbler"
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
    >
      <ObIcon name="grip-horizontal" />
    </div>

    <LabelsBadge :name="label.name" :color="label.color" />

    <div class="gap"></div>

    <button
      class="fp-btn-icon hidden-when-dragging"
      @click="emit('edit', 'name', label.id)"
    >
      <ObIcon name="square-pen" />
    </button>

    <button
      :class="['fp-btn-icon', 'hidden-when-dragging', ifColorUnderEdit]"
      @click="emit('edit', 'color', label.id)"
    >
      <ObIcon name="palette" />
    </button>

    <button
      class="fp-btn-icon hidden-when-dragging fp-danger"
      @click="emit('delete', label.id)"
    >
      <ObIcon name="trash-2" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.fp-grabbler {
  display: flex;
  align-items: center;
  justify-content: center;

  border: var(--border-width) solid transparent;
  cursor: grab;
}

.fp-dragging {
  opacity: 0.5;

  > .hidden-when-dragging {
    visibility: hidden;
  }
}
</style>
