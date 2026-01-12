<script setup lang="ts">
import { ObIcon } from '@/components'
</script>

<template>
  <div class="fp-obsidian-panel labels-panel">
    <div class="">
      <input type="text" />
      <button class="fp-btn-icon">
        <ObIcon name="square-plus" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.labels-panel {
  font-size: var(--font-ui-small);
  min-width: 240px;
}
</style>
