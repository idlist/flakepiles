<script setup lang="ts">
import type { FlakeLabel, FlakeLabelColor } from '@/schemes/common'
import { flakeLabelColors } from '@/schemes/common'
import LabelsColorDot from './LabelsColorDot.vue'

defineProps<{
  label: FlakeLabel
}>()

const emit = defineEmits<{
  (e: 'select', color: FlakeLabelColor): void
}>()
</script>

<template>
  <div class="label-item -colorpicker">
    <LabelsColorDot
      v-for="color of flakeLabelColors"
      :key="color"
      :color="color"
      :selected="label.color == color"
      @select="emit('select', color)"
    />
  </div>
</template>

<style scoped lang="scss">
.label-item {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  min-width: 0;

  &.-colorpicker {
    margin-top: var(--size-4-1);
    padding-top: var(--size-4-1);
    padding-bottom: var(--size-4-1);
    border-top: var(--fp-border);
    border-bottom: var(--fp-border);
    background-color: var(--background-primary-alt);
  }
}
</style>
