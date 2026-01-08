<script setup lang="ts">
import { computed, reactive, type StyleValue } from 'vue'
import { FLAKE_WIDTH, type Flake } from '@/data'
import FlakeView from '@/vue/FlakeView.vue'

const props = defineProps<{
  flakes: Flake[]
  columnWidth: number
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
}>()

const flakeHeights = reactive<Map<string, number>>(new Map())

const onFlakeUpdateHeight = (id: string, height: number) => {
  flakeHeights.set(id, height)
}

const heightLimit = computed(() => FLAKE_WIDTH * props.maxHeight)

const flakeStyle = (id: string) => {
  const height = flakeHeights.get(id) ?? 0
  const style: StyleValue = {
    width: `${props.columnWidth}px`,
  }

  if (props.enableMaxHeight) {
    const limit = heightLimit.value
    const isCompressed = height > limit

    if (props.elasticHeight) {
      if (isCompressed) {
        style.flexBasis = `${limit}px`
        style.flexGrow = 1
      } else {
        style.maxHeight = `${limit}px`
        style.flexGrow = 0
      }
    }
    else {
      style.maxHeight = `${limit}px`
    }
  }

  return style
}
</script>

<template>
  <div class="horizontal-flow">
    <div class="horizontal-layout">
      <FlakeView v-for="flake of flakes"
        :key="flake.id"
        :flake="flake"
        :style="flakeStyle(flake.id)"
        @update-height="onFlakeUpdateHeight" />
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

  height: 100%;
  padding: 0.5em 2em 0.5em 1em;
}
</style>
