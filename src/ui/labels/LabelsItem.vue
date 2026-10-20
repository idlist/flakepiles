<script setup lang="ts">
import type { FlakeLabel } from '@/schemes/common'
import LabelsColorPicker from './LabelsColorPicker.vue'
import type { LabelEditType } from './LabelsCore.vue'
import LabelsItemEdit from './LabelsItemEdit.vue'
import LabelsItemView from './LabelsItemView.vue'
import LabelsItemViewMore from './LabelsItemViewMore.vue'

const props = defineProps<{
  label: FlakeLabel
  more: boolean
  state: LabelEditType
  isDragging: boolean
}>()

const emit = defineEmits<{
  edit: [type: LabelEditType, id: string]
  finish: []
  delete: [id: string]
  reorder: [id: string]
}>()

function updateEditType(type: LabelEditType, id: string) {
  if (type === 'name') {
    emit('edit', type, id)
  } else if (type === 'color') {
    if (props.state === 'color') {
      emit('finish')
    } else {
      emit('edit', type, id)
    }
  }
}
</script>

<template>
  <LabelsItemView v-if="!more" :label="label" />

  <div v-else-if="state === 'idle' || state === 'color'">
    <LabelsItemViewMore
      :label="label"
      :state="state"
      :is-dragging="isDragging"
      @edit="updateEditType"
      @delete="(id) => emit('delete', id)"
      @reorder="(id) => emit('reorder', id)"
    />

    <LabelsColorPicker
      v-if="state === 'color'"
      :label="label"
    />
  </div>

  <LabelsItemEdit
    v-else-if="state === 'name'"
    :label="label"
    @finish="emit('finish')"
  />
</template>
