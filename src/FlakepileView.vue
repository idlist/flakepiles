<script setup lang="ts">
import { type ShallowRef } from 'vue'
import { type Flakepile } from './data'

const props = defineProps<{
  pile: ShallowRef<Flakepile | undefined>
}>()
const pile = props.pile

const emit = defineEmits<{
  (e: 'update'): void
}>()
</script>

<template>
  <div>Sample Text</div>
  <div>{{ JSON.stringify(pile) }}</div>
</template>

<style scoped lang="sass">
</style>
