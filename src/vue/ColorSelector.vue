<script setup lang="ts">
import type { FlakeLabelColor } from '@/data'
import { useCssIf, useCssWith } from '@/utils'

const props = withDefaults(defineProps<{
  color: FlakeLabelColor
  selected?: boolean
}>(), {
  selected: false,
})

const emit = defineEmits<{
  (e: 'select', color: FlakeLabelColor): void
}>()

const selectColor = () => {
  emit('select', props.color)
}

const cssColor = useCssWith(() => props.color, (s) => `fp-${s}`)
const cssIsSelected = useCssIf(() => props.selected, '-selected')
</script>

<template>
  <div :class="['label-color', cssIsSelected]" @click="selectColor">
    <div :class="['inner', cssColor]"></div>
  </div>
</template>

<style lang="scss" scoped>
.label-color {
  width: var(--size-4-6);
  height: var(--size-4-6);

  padding: var(--size-2-1);
  border: var(--size-2-1) solid transparent;
  border-radius: 50%;

  &.-selected {
    border: var(--size-4-1) solid hsl(var(--fp-accent-hsl));
  }

  >.inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
}
</style>
