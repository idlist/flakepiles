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
  padding: var(--size-4-2) var(--size-4-3);
  font-size: var(--font-ui-small);
  max-width: 320px;
}
</style>
