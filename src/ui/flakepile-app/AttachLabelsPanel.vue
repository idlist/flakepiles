<script setup lang="ts">
import AttachLabelsCore from '@/ui/labels/AttachLabelsCore.vue'
</script>

<template>
  <div class="menu select-label-panel">
    <AttachLabelsCore />
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
