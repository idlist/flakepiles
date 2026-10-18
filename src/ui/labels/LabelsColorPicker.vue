<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakeLabel, FlakeLabelColor } from '@/schemes/common'
import { flakeLabelColors } from '@/schemes/common'
import { inject } from 'vue'
import LabelsColorDot from './LabelsColorDot.vue'

const props = defineProps<{
  label: FlakeLabel
}>()

const plugin = inject('plugin') as FlakepilePluginRef

function pickColor(color: FlakeLabelColor) {
  plugin.updateLabelProps(props.label.id, 'color', color)
}
</script>

<template>
  <div class="labels-color-picker">
    <LabelsColorDot
      v-for="color of flakeLabelColors"
      :key="color"
      :color="color"
      :picked="label.color === color"
      @pick="pickColor"
    />
  </div>
</template>

<style scoped lang="scss">
.labels-color-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: var(--size-4-1);

  margin-top: var(--size-4-1);
  padding-top: var(--size-2-3);
  padding-bottom: var(--size-2-3);
  background-color: var(--background-primary);

  border: var(--border-width) solid var(--background-modifier-border);
  border-radius: var(--radius-m);
}
</style>
