<script setup lang="ts">
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useElementSize, useThrottleFn } from '@vueuse/core'
import { FLAKE_WIDTH, type Flake } from '@/data'
import FlakeView from '@/vue/FlakeView.vue'

const props = defineProps<{
  flakes: Flake[]
  columnWidth: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
}>()
// Cannot use `const flakes = props.flakes`, will break reactivity.

watch(() => props.flakes, () => {
  arrangeFlakes()
})

const refContainer = useTemplateRef('el-container')
const containerSize = useElementSize(refContainer)
const cw = ref(0)

onMounted(() => {
  watch(containerSize.width, useThrottleFn((value) => {
    cw.value = value
  }, 10, true), { immediate: true })
})

const GAP_SIZE = 16

const columnNumber = computed<number>(() => {
  const maxWidth = cw.value - GAP_SIZE * 2
  let width = props.columnWidth
  let columns = 0
  while (width < maxWidth) {
    width += props.columnWidth + GAP_SIZE
    columns++
  }
  return columns
})

watch(columnNumber, () => {
  arrangeFlakes()
})

const styleWidth = computed<string>(() => {
  let width: number
  if (props.elasticWidth) {
    let space = cw.value
    space -= GAP_SIZE * (columnNumber.value - 1)
    width = space / columnNumber.value
  }
  else {
    width = props.columnWidth
  }
  return `${width}px`
})

watch(styleWidth, () => {
  if (props.elasticWidth) {
    arrangeFlakes()
  }
})

const styleMaxHeight = computed<string>(() => {
  if (props.enableMaxHeight) {
    return `${FLAKE_WIDTH * props.maxHeight}px`
  }
  else {
    return 'none'
  }
})

watch(() => props.enableMaxHeight, () => {
  rerenderFlakes()
})

watch(styleMaxHeight, () => {
  if (props.enableMaxHeight) {
    arrangeFlakes()
  }
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
  if (!inited.value) return

  columnsContent.value = []
  if (columnNumber.value <= 0) return

  for (let i = 0; i < columnNumber.value; i++) {
    columnsContent.value.push(createColumnContent())
  }

  const maxHeight = FLAKE_WIDTH * props.maxHeight

  for (const flake of props.flakes) {
    let height = flakeHeights.get(flake.id)
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

    if (props.enableMaxHeight && height > maxHeight) {
      height = maxHeight
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
  if (!inited.value) return

  flakeHeights.clear()
  inited.value = false
}

defineExpose({
  arrangeFlakes,
  arrangeFlakesWithout,
  rerenderFlakes,
})
</script>

<template>
  <div ref="el-container" class="vertical-flow">
    <div class="vertical-layout">
      <div v-for="(column, i) of columnsContent"
        :key="i"
        class="column"
        :style="{ width: styleWidth }">
        <FlakeView v-for="flake of column.flakes"
          :key="flake.id"
          :flake="flake"
          :innerStyle="{ maxHeight: styleMaxHeight }"
          @update-height="onFlakeUpdateHeight" />
      </div>
    </div>
  </div>

  <div v-if="unrenderedFlakes.length"
    class="vertical-renderer"
    :style="{ width: styleWidth }">
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
