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
  rearrange()
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
  rearrange()
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
    arrange()
  }
}

const arrange = () => {
  if (pile.value.flow == 'vertical') {
    arrangeVertical()
  }
  else if (pile.value.flow == 'horizontal') {
    arrangeHorizontal()
  }
}

const arrangeVertical = () => {
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

const arrangeHorizontal = () => {
  noop()
}

const rearrange = () => {
  flakesInfoMap.clear()
}
</script>

<template>
  <div class="view-layout">
    <div class="header">
      <h1>{{ name }}</h1>
      <div>
        <button @click="addDummyFlake">Add Dummy Flake</button>
        <label for="flow">Flow: </label>
        <select v-model="pile.flow">
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
        </select>
      </div>
    </div>

    <div class="content">
      <div :class="['sub-layout', `-${pile.flow}`]">
        <div v-if="!pile.flakes.length">No Flakes</div>

        <template v-else>
          <div v-if="pile.flow == 'vertical'" class="vertical-view">
            <div class="vertical-flow">
              <div v-for="(column, i) of columnsContent"
                :key="i"
                class="column"
                :style="{ width: `${columnWidth}px` }">
                <FlakeView v-for="flake of column.flakes"
                  :key="flake.id"
                  :flake="flake" />
              </div>
            </div>
          </div>

          <div v-if="pile.flow == 'horizontal'" class="horizontal-view">
            <div class="horizontal-flow">
            </div>
          </div>

          <div v-if="unrenderedFlakes.length" :style="{ width: `${columnWidth}px` }">
            <FlakeView v-for="flake of unrenderedFlakes"
              :key="flake.id"
              :flake="flake"
              @rendered="onFlakeRendered" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
%_inset {
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.view-layout {
  @extend %_inset;
  position: fixed;
  top: var(--header-height);

  display: grid;
  grid-template-rows: min-content auto;

  &>.header {
    padding: 0.5em 1em;
  }

  &>.content {
    position: relative;
  }
}

.sub-layout {
  @extend %_inset;
  position: absolute;

  &.-vertical {
    overflow-y: auto;
  }

  &.-horizontal {
    overflow-x: auto;
  }
}

.vertical-view {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5em 1em 2em 1em;
}

.vertical-flow {
  display: flex;
  flex-direction: row;
  column-gap: 1em;

  &>.column {
    display: flex;
    flex-direction: column;
    row-gap: 1em;
  }
}

.horizontal-view {}
</style>
