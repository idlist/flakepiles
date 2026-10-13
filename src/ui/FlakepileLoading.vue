<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import { inject } from 'vue'

const plugin = inject('plugin') as FlakepilePluginRef
</script>

<template>
  <div class="flakepile-loading">
    <div class="loading">Loading Flakepile "{{ plugin.meta.filename }}"...</div>
  </div>
</template>

<style scoped lang="scss">
.flakepile-loading {
  position: fixed;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  .loading {
    color: var(--text-faint);
    font-size: var(--font-ui-medium);
  }
}
</style>
