<script setup lang="ts">
import type { Flake } from '@/data'
import FlakeView from '@/vue/FlakeView.vue'

defineProps<{
  flakes: Flake[]
  columnWidth: number
}>()
</script>

<template>
  <div class="mobile-flow">
    <FlakeView v-for="flake of flakes"
      :key="flake.id"
      :flake="flake" />
  </div>
</template>

<style lang="scss" scoped>
.mobile-flow {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 0.5em;
  padding: 0.5em 1em 2em 1em;
}
</style>
