<script setup lang="ts">
import LabelsCore from '@/ui/labels/LabelsCore.vue'
</script>

<template>
  <div class="menu labels-panel">
    <LabelsCore />
  </div>
</template>

<style scoped lang="scss">
.labels-panel {
  padding: var(--size-4-2) 0 var(--size-4-2) var(--scrollbar-width);
  font-size: var(--font-ui-small);
  width: 300px;

  pointer-events: visible;
}
</style>
