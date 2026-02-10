<script setup lang="ts">
import { inject } from 'vue'
import type { FileInfo } from '@/view'

const file = inject('file') as FileInfo
</script>

<template>
  <div class="fp-inset flakepile-loading">
    <div class="loading-flakes">Loading flakepile "{{ file.name }}"...</div>
  </div>
</template>

<style lang="scss" scoped>
.flakepile-loading {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-flakes {
  color: var(--text-faint);
  font-size: var(--font-ui-medium);
}
</style>
