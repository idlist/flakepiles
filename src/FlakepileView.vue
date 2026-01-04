<script setup lang="ts">
import { computed, inject, reactive, ref, triggerRef, watch } from 'vue'
import { noop } from '@rewl/kit'
import { createDummyFlake, FLAKE_WIDTH, type Flake } from './data'
import FlakeView from './FlakeView.vue'
import type { ContainerSizeRef, FileRef, PileShallowRef } from './app'

const props = defineProps<{
  pile: PileShallowRef
}>()
const pile = props.pile

watch(pile, () => {
  rearrangeFlakes()
})

const emit = defineEmits<{
  (e: 'update'): void
}>()

const fileRef = inject('fileRef') as FileRef
const name = computed<string>(() => {
  return fileRef.value?.basename ?? ''
})

const size = inject('size') as ContainerSizeRef
const columnWidth = computed(() => {
  return FLAKE_WIDTH * (pile.value?.width ?? 1)
})
const columnNumber = computed<number>(() => {
  return Math.floor(size.width.value / columnWidth.value)
})

watch(columnNumber, () => {
  rearrangeFlakes()
})

interface ColumnContent {
  height: number
  flakes: Flake[]
}

const columnsContent = ref<ColumnContent[]>([])

const addDummyFlake = () => {
  var dummy = createDummyFlake()
  pile.value.flakes.push(dummy)
  triggerRef(pile)
  emit('update')
}

interface FlakesInfo {
  width: number
  height: number
}

const flakesInfoMap = reactive<Map<number, FlakesInfo>>(new Map())

const unrenderedFlakes = computed<Flake[]>(() => {
  return pile.value.flakes.filter((item) => !flakesInfoMap.has(item.createdAt)) ?? []
})

const onFlakeRendered = (createdAt: number, width: number, height: number) => {
  flakesInfoMap.set(createdAt, { width, height })

  if (flakesInfoMap.size == pile.value.flakes.length) {
    arrangeFlakes()
  }
}

const arrangeFlakes = () => {
  if (pile.value.flow == 'vertical') {
    arrangeFlakesVertical()
  }
  else if (pile.value.flow == 'horizontal') {
    arrangeFlakesHorizontal()
  }
}

const arrangeFlakesVertical = () => {
  columnsContent.value = []

  for (let i = 0; i < columnNumber.value; i++) {
    columnsContent.value.push({
      height: 0,
      flakes: [],
    })
  }

  for (const flake of pile.value.flakes) {
    const height = flakesInfoMap.get(flake.createdAt)!.height

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
    shortestColumn.height += height + 16
    shortestColumn.flakes.push(flake)
  }
}

const arrangeFlakesHorizontal = () => {
  noop()
}

const rearrangeFlakes = () => {
  flakesInfoMap.clear()
}
</script>

<template>
  <h1>{{ name }}</h1>
  <button @click="addDummyFlake">Add Dummy Flake</button>
  <div class="title-spacing"></div>

  <div v-if="!pile.flakes.length">No Flakes</div>

  <template v-else>
    <template v-if="pile.flow == 'vertical'">
      <div class="vertical-view">
        <div class="vertical-flow">
          <div v-for="(column, i) of columnsContent"
            :key="i"
            class="column"
            :style="{ width: `${columnWidth}px` }">
            <FlakeView v-for="flake of column.flakes"
              :key="flake.createdAt"
              :flake="flake" />
          </div>
        </div>
      </div>

      <div v-if="unrenderedFlakes.length"
        class="vertical-renderer"
        :style="{ width: `${columnWidth}px` }">
        <FlakeView v-for="flake of unrenderedFlakes"
          :key="flake.createdAt"
          :flake="flake"
          @rendered="onFlakeRendered" />
      </div>
    </template>
  </template>
</template>

<style lang="scss" scoped>
.title-spacing {
  margin: 0.5rem;
}

.vertical-view {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vertical-flow {
  display: flex;
  flex-direction: row;
  column-gap: 1em;

  >.column {
    display: flex;
    flex-direction: column;
    row-gap: 1em;
  }
}
</style>
