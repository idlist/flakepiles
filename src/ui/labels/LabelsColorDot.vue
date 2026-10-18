<script setup lang="ts">
import type { FlakeLabelColor } from '@/schemes/common'
import { useCssIf, useCssWith } from '@/use'

const props = withDefaults(
  defineProps<{
    color: FlakeLabelColor
    picked?: boolean
  }>(),
  {
    picked: false,
  },
)

const emit = defineEmits<{
  (e: 'pick', color: FlakeLabelColor): void
}>()

function selectColor() {
  emit('pick', props.color)
}

const ifPicked = useCssIf(() => props.picked, '-picked')
const withColor = useCssWith(() => props.color, (val) => `fp-color-${val}`)
</script>

<template>
  <div :class="['labels-color-dot', ifPicked]" @click="selectColor">
    <div :class="['color-dot', withColor]"></div>
  </div>
</template>

<style scoped lang="scss">
.labels-color-dot {
  width: var(--size-4-6);
  height: var(--size-4-6);

  padding: var(--size-2-1);
  border: var(--size-2-1) solid transparent;
  border-radius: 50%;

  &.-picked {
    border: var(--size-4-1) solid var(--color-accent);
  }

  > .color-dot {
    width: 100%;
    height: 100%;
    border-radius: 50%;

    background-color: var(--fp-color-tag);
  }
}
</style>
