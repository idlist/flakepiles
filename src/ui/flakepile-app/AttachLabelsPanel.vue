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
  padding: var(--size-4-2) var(--size-4-3);
  font-size: var(--font-ui-small);
  max-width: 360px;

  pointer-events: visible;
}
</style>
