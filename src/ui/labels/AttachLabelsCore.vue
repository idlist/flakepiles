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
    <div v-if="labels.length === 0" class="attach-labels-none">
      No Labels.
    </div>

    <AttachLabelsItem
      v-else
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

  overflow-y: auto;
  padding-right: var(--size-4-1);

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
