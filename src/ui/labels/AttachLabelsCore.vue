<script setup lang="ts">
import type { FlakepileLabelsRef } from '@/ui/FlakepileApp.vue'
import { inject } from 'vue'
import AttachLabelsItem from './AttachLabelsItem.vue'

export interface AttachLabelsProps {
  id: string
}

defineProps<AttachLabelsProps>()
const labelIds = defineModel<string[]>('labelIds', { required: true })

const labels = inject('labels') as FlakepileLabelsRef

function updateChecked(labelId: string, checked: boolean) {
  if (checked) {
    labelIds.value.push(labelId)
  } else {
    const index = labelIds.value.indexOf(labelId)
    if (index !== -1) labelIds.value.splice(index, 1)
  }
}
</script>

<template>
  <div class="attach-labels-core">
    <div v-if="labels.length === 0" class="attach-labels-none">
      No Labels.
    </div>

    <AttachLabelsItem
      v-else
      v-for="label of labels"
      :key="label.id"
      :name="label.name"
      :color="label.color"
      :checked="labelIds.contains(label.id)"
      @update="(checked) => updateChecked(label.id, checked)"
    />
  </div>
</template>

<style scoped lang="scss">
.attach-labels-core {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--size-4-4);
  row-gap: var(--size-4-2);

  overflow-y: auto;
  padding-right: var(--scrollbar-width);

  .is-phone & {
    padding-right: 0;
  }
}

.attach-labels-none {
  color: var(--text-faint);
  font-style: italic;

  padding-right: var(--scrollbar-width);

  .is-phone & {
    padding-right: 0;
  }
}
</style>
