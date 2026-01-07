<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Flake } from '@/data'
import FlakeView from '@/vue/FlakeView.vue'

const props = defineProps<{
  flakes: Flake[]
  columnWidth: number
  containerWidth: number
}>()
// Cannot use `const flakes = props.flakes`, will break reactivity.

const GAP_SIZE = 16

const columnNumberVertical = computed<number>(() => {
  const columns = Math.floor(props.containerWidth / (props.columnWidth + GAP_SIZE))
  return columns >= 1 ? columns : 1
})

watch(columnNumberVertical, () => {
  arrangeFlakes()
})

interface ColumnContent {
  height: number
  flakes: Flake[]
}

const columnsContent = ref<ColumnContent[]>([])

const createColumnContent = (): ColumnContent => {
  return {
    height: 0,
    flakes: [],
  }
}

const inited = ref(false)
const flakeHeights = reactive<Map<string, number>>(new Map())

const onFlakeInit = () => {
  if (flakeHeights.size == props.flakes.length) {
    inited.value = true
    arrangeFlakes()
  }
}

const onFlakeUpdateHeight = (id: string, height: number) => {
  flakeHeights.set(id, height)
}

const unrenderedFlakes = computed(() => {
  if (!inited.value) {
    return props.flakes
  }
  else {
    const unrendered = props.flakes.filter((flake) => !flakeHeights.has(flake.id))
    return unrendered
  }
})

const arrangeFlakes = () => {
  columnsContent.value = []

  for (let i = 0; i < columnNumberVertical.value; i++) {
    columnsContent.value.push(createColumnContent())
  }

  for (const flake of props.flakes) {
    const height = flakeHeights.get(flake.id)
    if (!height) {
      console.warn(`Cannot get height for Flake ${flake.id}.`)
      continue
    }

    let shortestIndex = 0
    let shortest = Number.MAX_SAFE_INTEGER

    for (let i = 0; i < columnsContent.value.length; i++) {
      const content = columnsContent.value[i]!
      if (content.height < shortest) {
        shortest = content.height
        shortestIndex = i
      }
    }

    const shortestColumn = columnsContent.value[shortestIndex]!
    shortestColumn.height += height + GAP_SIZE
    shortestColumn.flakes.push(flake)
  }
}

const arrangeFlakesWithout = (id: string) => {
  flakeHeights.delete(id)
  arrangeFlakes()
}

const rerenderFlakes = () => {
  flakeHeights.clear()
}

defineExpose({
  arrangeFlakes,
  arrangeFlakesWithout,
  rerenderFlakes,
})
</script>

<template>
  <div class="vertical-flow">
    <div class="vertical-layout">
      <div v-for="(column, i) of columnsContent"
        :key="i"
        class="column"
        :style="{ width: `${columnWidth}px` }">
        <FlakeView v-for="flake of column.flakes"
          :key="flake.id"
          :flake="flake"
          @update-height="onFlakeUpdateHeight" />
      </div>
    </div>
  </div>

  <div v-if="unrenderedFlakes.length"
    class="vertical-renderer"
    :style="{ width: `${columnWidth}px` }">
    <FlakeView v-for="flake of unrenderedFlakes"
      :key="flake.id"
      :flake="flake"
      @init="onFlakeInit"
      @update-height="onFlakeUpdateHeight" />
  </div>
</template>

<style lang="scss" scoped>
.vertical-flow {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0.5em 1em 2em 1em;
}

.vertical-layout {
  display: flex;
  flex-direction: row;
  column-gap: 1em;

  >.column {
    display: flex;
    flex-direction: column;
    row-gap: 1em;
  }
}

.vertical-renderer {
  visibility: hidden;
}
</style>
