<script setup lang="ts">
import type { FlakeLabel } from '@/schemes/common'
import { useCssIf } from '@/use'
import { ObIcon } from '@/wrappers'
import LabelsBadge from './LabelsBadge.vue'
import type { LabelEditingState } from './LabelsCore.vue'

const props = defineProps<{
  label: FlakeLabel
  state: LabelEditingState
}>()

const emit = defineEmits<{
  edit: [type: LabelEditingState, id: string]
  delete: [id: string]
}>()

const IfColorUnderEdit = useCssIf(() => props.state === 'color', 'fp-invert')
</script>

<template>
  <div class="fp-labels-item">
    <div class="fp-btn-icon fp-dragger" draggable="true">
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
      :class="['fp-btn-icon', IfColorUnderEdit]"
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
  </div>
</template>

<style scoped lang="scss">
.fp-dragger {
  display: flex;
  align-items: center;
  justify-content: center;

  border: var(--border-width) solid transparent;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}
</style>
