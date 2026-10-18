<script setup lang="ts">
import type { FlakeLabel } from '@/schemes/common'
import type { FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/use'
import { ObIcon } from '@/wrappers'
import { Keymap } from 'obsidian'
import { inject, ref } from 'vue'
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

const meta = inject('meta') as FlakepileMetaRef

function startReorder(event: PointerEvent) {
  if (event.button !== 0) return

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)

  emit('reorder', props.label.id)
}

/* Label Deletion */

const tryDeleting = ref(false)

function tryRequestDelete(event: MouseEvent) {
  if (meta.value.directDelete || Keymap.isModifier(event, 'Mod')) {
    requestDelete()
  } else {
    tryDeleting.value = true
  }
}

function requestDelete() {
  emit('delete', props.label.id)
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
      @click="tryRequestDelete"
    >
      <ObIcon name="trash-2" />
    </button>

    <div
      v-if="tryDeleting"
      class="fp-labels-item-delete-fuse"
      @click="tryDeleting = false"
    >
      <button
        class="fp-btn-icon fp-warning fp-labels-item-delete"
        @click="requestDelete"
      >
        <ObIcon name="message-circle-question-mark" />
      </button>
    </div>
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

.fp-labels-item.-dragging {
  opacity: 0.5;
}

.fp-labels-item.-dragging > .fp-grabbler {
  cursor: grabbing;
}

.fp-labels-item-delete-fuse {
  position: absolute;
  inset: 0;
  z-index: 16;

  background-color: color-mix(in oklch, var(--menu-background) 75%, transparent);
}

.fp-labels-item-delete {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
