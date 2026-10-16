<script setup lang="ts">
import type { FlakeLabelColor } from '@/schemes/common'
import { useCssWith } from '@/use'

const props = defineProps<{
  color: FlakeLabelColor
}>()

const withColor = useCssWith(props.color, (val) => `fp-color-${val}`)
</script>

<template>
  <div :class="['labels-badge', withColor]">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.lables-badge {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  font-size: var(--font-ui-smaller);
  padding: var(--size-2-1) var(--size-2-3);
  border-radius: var(--size-4-4);

  color: var(--base-color-00);
  background-color: var(--color-tag);
}
</style>
