<script setup lang="ts">
import AttachLabelsCore, { type AttachLabelsProps } from '@/ui/labels/AttachLabelsCore.vue'

defineProps<AttachLabelsProps>()
</script>

<template>
  <div class="menu select-label-panel">
    <AttachLabelsCore :flake="flake" />
  </div>
</template>

<style scoped lang="scss">
.select-label-panel {
  padding: var(--size-4-2) 0 var(--size-4-2) var(--scrollbar-width);
  font-size: var(--font-ui-small);
  max-width: 240px;

  pointer-events: visible;

  .is-tablet & {
    padding-left: var(--size-4-3);
    padding-right: var(--size-4-3);
  }
}
</style>
