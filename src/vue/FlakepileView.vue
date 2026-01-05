<script setup lang="ts">
import { computed, inject, reactive, ref, triggerRef, useTemplateRef, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { createDummyFlake, FLAKE_WIDTH, type Flake } from '@/data'
import { usePartialRef } from '@/hooks'
import type { FileRef, PileShallowRef } from '@/app'
import FlakeView from './FlakeView.vue'
import ObIcon from './ObIcon.vue'

const props = defineProps<{
  pile: PileShallowRef
}>()
const pile = props.pile

const emit = defineEmits<{
  (e: 'update'): void
}>()

watch(pile, () => {
  emit('update')
})

const flow = usePartialRef(props.pile, 'flow')
const sortBy = usePartialRef(props.pile, 'sortBy')
const sortOrder = usePartialRef(props.pile, 'sortOrder')

const sortedFlakes = computed<Flake[]>(() => {
  const sorted = [...pile.value.flakes]

  sorted.sort((a, b) => {
    if (sortBy.value == 'name') {
      if (sortOrder.value == 'asc') {
        return a.name.localeCompare(b.name)
      }
      else if (sortOrder.value == 'desc') {
        return b.name.localeCompare(a.name)
      }
    }
    else if (sortBy.value == 'createdAt') {
      if (sortOrder.value == 'asc') {
        return a.createdAt - b.createdAt
      }
      else if (sortOrder.value == 'desc') {
        return b.createdAt - a.createdAt
      }
    }
    else if (sortBy.value == 'modifiedAt') {
      if (sortOrder.value == 'asc') {
        return a.modifiedAt - b.modifiedAt
      }
      else if (sortOrder.value == 'desc') {
        return b.modifiedAt - a.modifiedAt
      }
    }
    return 0
  })

  return sorted
})

const fileRef = inject('fileRef') as FileRef

const name = computed<string>(() => {
  return fileRef.value?.basename ?? ''
})

const elContent = useTemplateRef('el-content')
const size = useElementSize(elContent)

const columnWidth = computed(() => {
  return FLAKE_WIDTH * pile.value.width
})
const columnNumberVertical = computed<number>(() => {
  return Math.floor(size.width.value / columnWidth.value)
})

interface ColumnContent {
  height: number
  flakes: Flake[]
}

const createColumnContent = (height: number = 0): ColumnContent => {
  return {
    height,
    flakes: [],
  }
}

const columnsContent = ref<ColumnContent[]>([])

const addDummyFlake = () => {
  var dummy = createDummyFlake()
  pile.value.flakes.push(dummy)
  triggerRef(pile)
}

interface FlakesInfo {
  width: number
  height: number
}

const flakesInfoMap = reactive<Map<string, FlakesInfo>>(new Map())

const unrenderedFlakes = computed<Flake[]>(() => {
  return pile.value.flakes.filter((item) => !flakesInfoMap.has(item.id)) ?? []
})

const onFlakeRendered = (id: string, width: number, height: number) => {
  flakesInfoMap.set(id, { width, height })

  if (flakesInfoMap.size == pile.value.flakes.length) {
    arrangeFlake()
  }
}

const arrangeFlake = () => {
  if (flow.value == 'vertical') {
    arrangeFlakeVertical()
  }
  else if (flow.value == 'horizontal') {
    arrangeFlakeHorizontal()
  }
}

const GAP_SIZE = 16

const arrangeFlakeVertical = () => {
  columnsContent.value = []

  for (let i = 0; i < columnNumberVertical.value; i++) {
    columnsContent.value.push(createColumnContent())
  }

  for (const flake of sortedFlakes.value) {
    const height = flakesInfoMap.get(flake.id)!.height

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

const arrangeFlakeHorizontal = () => {
  columnsContent.value = []
  let column: ColumnContent = createColumnContent(GAP_SIZE)

  for (const flake of sortedFlakes.value) {
    const height = flakesInfoMap.get(flake.id)!.height
    const nextHeight = column.height + height

    if (column.flakes.length > 0 && nextHeight > size.height.value) {
      columnsContent.value.push(column)
      column = createColumnContent(GAP_SIZE)
    }

    column.height += height + GAP_SIZE
    column.flakes.push(flake)
  }

  if (column.flakes.length) {
    columnsContent.value.push(column)
  }
}

const rearrangeFlake = () => {
  flakesInfoMap.clear()
}

watch([
  () => pile.value.id,
  () => pile.value.flow,
  () => pile.value.sortBy,
  () => pile.value.sortOrder,
], () => {
  rearrangeFlake()
})

watch(columnNumberVertical, () => {
  if (flow.value == 'vertical') {
    rearrangeFlake()
  }
})

watch(size.height, () => {
  if (flow.value == 'horizontal') {
    rearrangeFlake()
  }
})
</script>

<template>
  <div class="view-layout">
    <div class="header">
      <h1>{{ name }}</h1>
      <div class="tool-list">
        <button @click="addDummyFlake">Add Flake</button>
        <div class="item">
          <label>Flow</label>
          <select v-model="flow">
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>
        <div class="item">
          <label>Sort By</label>
          <select v-model="sortBy">
            <option value="name">Name</option>
            <option value="createdAt">Time Created</option>
            <option value="modifiedAt">Time Modified</option>
          </select>
          <button
            v-if="sortOrder == 'desc'"
            class="icon-button"
            @click="sortOrder = 'asc'">
            <ObIcon name="arrow-down" />
          </button>
          <button
            v-if="sortOrder == 'asc'"
            class="icon-button"
            @click="sortOrder = 'desc'">
            <ObIcon name="arrow-up" />
          </button>
        </div>
      </div>
    </div>

    <div ref="el-content" class="content">
      <div :class="['sub-layout', `-${flow}`]">
        <div v-if="!pile.flakes.length" class="no-flakes">No Flakes</div>

        <template v-else>
          <div v-if="flow == 'vertical'" class="vertical-view">
            <div class="flow">
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

          <div v-if="flow == 'horizontal'" class="horizontal-view">
            <div v-for="(column, i) of columnsContent"
              :key="i"
              class="column"
              :style="{ width: `${columnWidth}px` }">
              <FlakeView v-for="flake of column.flakes"
                :key="flake.id"
                :flake="flake" />
            </div>
          </div>

          <div
            v-if="unrenderedFlakes.length"
            class="flake-renderer"
            :style="{ width: `${columnWidth}px` }">
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
    overflow-y: hidden;
  }
}

.tool-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 0.5em;
  row-gap: 0.25rem;
  font-size: var(--font-small);

  &>.item {
    display: flex;
    align-items: center;
    column-gap: 0.25em;
  }
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5em;
}

.no-flakes {
  width: 100%;
  padding: 1rem;
  font-style: italic;
  color: var(--text-faint);
  text-align: center;
}

.vertical-view {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5em 1em 2em 1em;

  &>.flow {
    display: flex;
    flex-direction: row;
    column-gap: 1em;
  }

  &>.flow>.column {
    display: flex;
    flex-direction: column;
    row-gap: 1em;
  }
}

.horizontal-view {
  height: 100%;
  display: flex;
  flex-direction: row;
  padding: 0.5em 2em 0.5em 1em;
  column-gap: 1em;

  &>.column {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    row-gap: 1em;
  }
}

.flake-renderer {
  opacity: 0;
}
</style>
