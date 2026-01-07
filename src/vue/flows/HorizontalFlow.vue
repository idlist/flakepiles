<script setup lang="ts">
import type { Flake } from '@/data'
import FlakeView from '@/vue/FlakeView.vue'

defineProps<{
  flakes: Flake[]
  columnWidth: number
}>()
</script>


<template>
  <div class="horizontal-flow">
    <div class="horizontal-layout">
      <FlakeView v-for="flake of flakes"
        :key="flake.id"
        :flake="flake"
        :style="{ width: `${columnWidth}px` }" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.horizontal-flow {
  display: flex;
  height: 100%;
}

.horizontal-layout {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  flex-wrap: wrap;
  column-gap: 1em;
  row-gap: 1em;
  padding: 0.5em 2em 0.5em 1em;
}
</style>
