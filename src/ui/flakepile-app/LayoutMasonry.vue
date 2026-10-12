<script setup lang="ts">
import type { FlakepilePlugin } from '@/custom-view.ts'
import type { Flake, FlakepileMeta } from '@/schemes/v1.ts'
import type { FlakeIdEditing, ScrollAxis } from '@/ui/FlakepileApp.vue'
import { px } from '@/utils.ts'
import type { UseElementSizeReturn } from '@vueuse/core'
import { computed, inject, type StyleValue } from 'vue'
import FlakeEdit from './FlakeEdit.vue'
import FlakeView from './FlakeView.vue'

const props = defineProps<{
  meta: FlakepileMeta
  usableSize: UseElementSizeReturn
  scroll: ScrollAxis
  flakes: Flake[]
}>()

const plugin = inject('plugin') as FlakepilePlugin
const flakeIdEditing = inject('flakeIdEditing') as FlakeIdEditing

const flakesViewing = computed<Flake[]>(() => {
  return props.flakes.filter((flake) => flake.id !== flakeIdEditing.value)
})

const stylesViewing = computed<Map<string, StyleValue>>(() => {
  const map = new Map<string, StyleValue>()

  for (const flake of flakesViewing.value) {
    map.set(flake.id, { width: px(240) })
  }

  return map
})

const flakeEditing = computed<Flake | undefined>(() => {
  return props.flakes.find((flake) => flake.id === flakeIdEditing.value)
})

const styleViewing = computed<StyleValue>(() => {
  return { width: px(240) }
})

function deleteFlake(id: string) {
  plugin.deleteFlake(id)
}

function finishEditing(_id: string) {
  flakeIdEditing.value = null
}
</script>

<template>
  <div class="layout-masonry">
    <FlakeView
      v-for="flake of flakesViewing"
      :key="flake.id"
      :flake="flake"
      :style="stylesViewing.get(flake.id)"
      @edit="(id) => flakeIdEditing = id"
      @delete="deleteFlake"
    />
    <FlakeEdit
      v-if="flakeEditing"
      :flake="flakeEditing"
      :style="styleViewing"
      @finish="finishEditing"
    />
  </div>
</template>

<style scoped lang="scss">
.layout-masonry {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
