<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake } from '@/schemes/common'
import type { FlakepileLabelsRef } from '@/ui/FlakepileApp.vue'
import { inject } from 'vue'
import AttachLabelsItem from './AttachLabelsItem.vue'

export interface AttachLabelsProps {
  flake: Flake
}

const props = defineProps<AttachLabelsProps>()

const plugin = inject('plugin') as FlakepilePluginRef
const labels = inject('labels') as FlakepileLabelsRef

function updateFlakeLabel(id: string, checked: boolean) {
  plugin.updateFlakeLabel(props.flake.id, id, checked)
}
</script>

<template>
  <div class="attach-labels-core">
    <AttachLabelsItem
      v-for="label of labels"
      :key="label.id"
      :name="label.name"
      :color="label.color"
      :checked="flake.labels.contains(label.id)"
      @update-checked="(checked) => updateFlakeLabel(label.id, checked)"
    />
  </div>
</template>

<style scoped lang="scss">
.attach-labels-core {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--size-4-4);
  row-gap: var(--size-4-2);
}
</style>
