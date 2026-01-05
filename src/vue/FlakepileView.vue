<script setup lang="ts">
import { computed, inject, reactive, ref, triggerRef, useTemplateRef, watch } from 'vue'
import { useDebounceFn, useElementSize } from '@vueuse/core'
import { createDummyFlake, createFlake, FLAKE_WIDTH, type Flake } from '@/data'
import { usePartialRef } from '@/hooks'
import type { FileRef, PileShallowRef } from '@/app'
import FlakeView from './FlakeView.vue'
import ObIcon from './ObIcon.vue'

const props = defineProps<{
  pile: PileShallowRef
}>()
const pile = props.pile

const emit = defineEmits<{
  (e: 'edited'): void
}>()

watch(pile, () => {
  emit('edited')
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

const refContent = useTemplateRef('el-content')
const size = useElementSize(refContent)

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

const addFlake = () => {
  var flake = createFlake()
  pile.value.flakes.push(flake)
  triggerRef(pile)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const addDummyFlake = () => {
  var dummy = createDummyFlake()
  pile.value.flakes.push(dummy)
  triggerRef(pile)
}

const flakesHeight = reactive<Map<string, number>>(new Map())

const unrenderedFlakes = computed<Flake[]>(() => {
  const unrendered = pile.value.flakes
    .filter((item) => !flakesHeight.has(item.id)) ?? []
  return unrendered
})

const onFlakeSizeInit = (id: string, height: number) => {
  flakesHeight.set(id, height)

  if (flakesHeight.size == pile.value.flakes.length) {
    arrangeFlake()
  }
}

const onFlakeSizeUpdate = (id: string, height: number) => {
  flakesHeight.set(id, height)

  if (pile.value.flow == 'horizontal') {
    arrangeFlake()
  }
}

const arrangeFlakeDebounced = async () => {
  if (pile.value.flow == 'vertical') {
    arrangeFlakeVertical()
  }
  if (pile.value.flow == 'horizontal') {
    arrangeFlakeHorizontal()
  }
}

const arrangeFlake = useDebounceFn(arrangeFlakeDebounced, 0)

const GAP_SIZE = 16
const SCROLL_SIZE = 12

const arrangeFlakeVertical = () => {
  columnsContent.value = []

  for (let i = 0; i < columnNumberVertical.value; i++) {
    columnsContent.value.push(createColumnContent())
  }

  for (const flake of sortedFlakes.value) {
    const height = flakesHeight.get(flake.id)
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

const arrangeFlakeHorizontal = () => {
  columnsContent.value = []
  const occupied = GAP_SIZE + SCROLL_SIZE
  let column: ColumnContent = createColumnContent(occupied)

  for (const flake of sortedFlakes.value) {
    const height = flakesHeight.get(flake.id)

    if (!height) {
      console.warn(`Cannot get height for Flake ${flake.id}.`)
      continue
    }
    const nextHeight = column.height + height

    if (column.flakes.length > 0 && nextHeight > size.height.value) {
      columnsContent.value.push(column)
      column = createColumnContent(occupied)
    }

    column.height += height + GAP_SIZE
    column.flakes.push(flake)
  }

  if (column.flakes.length) {
    columnsContent.value.push(column)
  }
}

const flakesInEdit = reactive<Set<string>>(new Set())

watch(() => pile.value.id, () => {
  flakesInEdit.clear()
})

const onFlakeEdit = (id: string, state: 'begin' | 'finish') => {
  if (state == 'begin') {
    flakesInEdit.add(id)
  }
  else if (state == 'finish') {
    flakesInEdit.delete(id)

    triggerRef(pile)
    arrangeFlake()
  }
}

const onFlakeDelete = (id: string) => {
  const index = pile.value.flakes.findIndex((item) => item.id == id)
  if (index == -1) return
  pile.value.flakes.splice(index, 1)
  flakesHeight.delete(id)

  triggerRef(pile)
  arrangeFlake()
}

const rearrangeFlake = () => {
  flakesHeight.clear()
}

watch(columnNumberVertical, () => {
  if (pile.value.flow == 'vertical') {
    rearrangeFlake()
  }
})

watch(size.height, () => {
  if (pile.value.flow == 'horizontal') {
    rearrangeFlake()
  }
})

watch([
  () => pile.value.id,
  () => pile.value.flow,
  () => pile.value.sortBy,
  () => pile.value.sortOrder,
], () => {
  rearrangeFlake()
})
</script>

<template>
  <div class="view-layout">
    <div class="header">
      <h1 class="file-name">{{ name }}</h1>
      <div class="tool-list">
        <button @click="addFlake">Add Flake</button>
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
            class="_fp-btn-icon"
            @click="sortOrder = 'asc'">
            <ObIcon name="arrow-down" />
          </button>
          <button
            v-if="sortOrder == 'asc'"
            class="_fp-btn-icon"
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
            <div class="vertical-flow">
              <div v-for="(column, i) of columnsContent"
                :key="i"
                class="column"
                :style="{ width: `${columnWidth}px` }">
                <FlakeView v-for="flake of column.flakes"
                  :key="flake.id"
                  :flake="flake"
                  :edit="flakesInEdit.has(flake.id)"
                  @size-update="onFlakeSizeUpdate"
                  @edit="onFlakeEdit"
                  @delete="onFlakeDelete" />
              </div>
            </div>
          </div>

          <div v-if="flow == 'horizontal'" class="horizontal-view">
            <div class="horizontal-flow">
              <div v-for="(column, i) of columnsContent"
                :key="i"
                class="column"
                :style="{ width: `${columnWidth}px` }">
                <FlakeView v-for="flake of column.flakes"
                  :key="flake.id"
                  :flake="flake"
                  :edit="flakesInEdit.has(flake.id)"
                  @size-update="onFlakeSizeUpdate"
                  @edit="onFlakeEdit"
                  @delete="onFlakeDelete" />
              </div>
            </div>
          </div>

          <div
            v-if="unrenderedFlakes.length"
            class="flake-renderer"
            :style="{ width: `${columnWidth}px` }">
            <FlakeView v-for="flake of unrenderedFlakes"
              :key="flake.id"
              :flake="flake"
              :edit="false"
              @size-init="onFlakeSizeInit" />
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

.file-name {
  margin: 0.25em 0;
}

.tool-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 1em;
  row-gap: 0.25em;
  font-size: var(--font-small);

  &>.item {
    display: flex;
    align-items: center;
    column-gap: 0.5em;
  }
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

.horizontal-view {
  height: 100%;
  display: flex;
}

.horizontal-flow {
  display: flex;
  flex: 1 0 0;
  flex-direction: row;
  column-gap: 1em;
  padding: 0.5em 2em 0.5em 1em;

  &>.column {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    row-gap: 1em;
  }
}

.flake-renderer {
  visibility: hidden;
}
</style>
