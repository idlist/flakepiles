<script setup lang="ts">
import type { FlakeLabel } from '@/schemes/common'
import { useCssIf } from '@/use'
import { ObIcon } from '@/wrappers'
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
  reorder: [id: string]
}>()

function startReorder(event: PointerEvent) {
  if (event.button !== 0) return

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)

  emit('reorder', props.label.id)
}

const ifDragging = useCssIf(() => props.isDragging, '-dragging')
const ifColorUnderEdit = useCssIf(() => props.state === 'color', 'fp-invert')
</script>

<template>
  <div :class="['fp-labels-item', ifDragging]">
    <div class="fp-btn-icon fp-grabbler" @pointerdown="startReorder">
      <ObIcon name="grip-horizontal" />
    </div>

    <LabelsBadge :name="label.name" :color="label.color" />

    <div class="gap"></div>

    <button
      class="fp-btn-icon"
      @click="emit('edit', 'name', label.id)"
    >
      <ObIcon name="square-pen" />
    </button>

    <button
      :class="['fp-btn-icon', ifColorUnderEdit]"
      @click="emit('edit', 'color', label.id)"
    >
      <ObIcon name="palette" />
    </button>

    <button
      class="fp-btn-icon fp-danger"
      @click="emit('delete', label.id)"
    >
      <ObIcon name="trash-2" />
    </button>

    <div v-if="isDragging" class="labels-mask"></div>
  </div>
</template>

<style scoped lang="scss">
.fp-grabbler {
  display: flex;
  align-items: center;
  justify-content: center;

  border: var(--border-width) solid transparent;
  touch-action: none;
  cursor: grab;
}

.fp-labels-item.-grabbing > .fp-grabbler {
  cursor: grabbing;
}

.labels-mask {
  position: absolute;
  inset: 0;
  background-color: color-mix(in oklch, var(--background-primary) 50%, transparent);
}
</style>
