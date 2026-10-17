<script setup lang="ts">
import type { FlakeLabelColor } from '@/schemes/common'
import { useCssWith } from '@/use'

const props = withDefaults(
  defineProps<{
    name: string
    color?: FlakeLabelColor
  }>(),
  {
    color: 'none',
  },
)

const withColor = useCssWith(() => props.color, (val) => `fp-color-${val}`)
</script>

<template>
  <div :class="['labels-badge', withColor]" :title="name">
    {{ name }}
  </div>
</template>

<style scoped lang="scss">
.labels-badge {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  font-size: var(--font-ui-smaller);
  padding: var(--size-2-1) var(--size-2-3);
  border-radius: var(--size-4-4);

  color: var(--color-base-00);
  background-color: var(--fp-color-tag);
}
</style>
