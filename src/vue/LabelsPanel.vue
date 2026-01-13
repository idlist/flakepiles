<script setup lang="ts">
import { ObIcon } from '@/components'
import type { FlakeLabel } from '@/data'

defineProps<{ labels: FlakeLabel[] }>()
</script>

<template>
  <div class="fp-obsidian-panel labels-panel">
    <div class="row">
      <input type="text" />
      <button class="fp-btn-icon">
        <ObIcon name="square-plus" />
      </button>
    </div>

    <div v-for="label of labels" :key="label.id" class="row">
    </div>
  </div>
</template>

<style lang="scss" scoped>
.labels-panel {
  min-width: 240px;

  >.row {
    display: flex;
    align-items: center;
    column-gap: var(--size-4-1);
  }
}
</style>
