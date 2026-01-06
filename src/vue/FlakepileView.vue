<script setup lang="ts">
import { computed, inject, reactive, ref, triggerRef, useTemplateRef, watch } from 'vue'
import { useDebounceFn, useElementSize } from '@vueuse/core'
import { createDummyFlake, createFlake, FLAKE_WIDTH, type Flake } from '@/data'
import type { FileRef, PileShallowRef } from '@/app'
import { usePartialRef } from '@/hooks'
import { ObIcon, ObSearch } from '@/components'
import FlakeView from './FlakeView.vue'

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

const isSubMenuOpen = ref(false)

const toggleSubMenu = () => {
  isSubMenuOpen.value = !isSubMenuOpen.value
}

watch(() => pile.value.id, () => {
  isSubMenuOpen.value = false
})

const searchQueue = ref<string>('')

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
}

const GAP_SIZE = 16

const arrangeFlakeDebounced = async () => {
  if (columnsContent.value.length) {
    columnsContent.value = []
  }

  if (pile.value.flow == 'vertical') {
    arrangeFlakeVertical()
  }
}

const arrangeFlake = useDebounceFn(arrangeFlakeDebounced, 0)

const arrangeFlakeVertical = () => {
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

const onFlakeEdit = () => {
  triggerRef(pile)
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
      <h1 :class="['file-name', isSubMenuOpen ? '-faint' : '']">
        {{ name }}
      </h1>
      <div class="tools-main">
        <button class="_fp-btn-icon-at-left" @click="addFlake">
          <ObIcon name="plus" /> Add Flake
        </button>

        <div class="tool-item -grow">
          <ObSearch v-model="searchQueue" class="wfull" />
        </div>

        <button class="_fp-btn-icon">
          <ObIcon name="square-menu" @click="toggleSubMenu" />
        </button>

        <div v-if="isSubMenuOpen" class="tools-sub">
          <button class="_fp-btn-icon-at-left">
            <ObIcon name="tags" /> Labels
          </button>

          <div class="tool-item -grow"></div>

          <button class="_fp-btn-icon-at-left">
            <ObIcon name="scaling" /> Size Options
          </button>

          <div class="tool-item">
            <label>Flow</label>
            <ObIcon v-if="flow == 'vertical'" name="move-vertical" />
            <ObIcon v-if="flow == 'horizontal'" name="move-horizontal" />
            <select v-model="flow" class="dropdown">
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <div class="tool-item">
            <label>Sort By</label>
            <select v-model="sortBy" class="dropdown">
              <option value="name">Name</option>
              <option value="createdAt">Time Created</option>
              <option value="modifiedAt">Time Modified</option>
            </select>
            <button
              v-if="sortOrder == 'desc'"
              class="_fp-btn-icon"
              @click="sortOrder = 'asc'">
              <ObIcon name="arrow-down-wide-narrow" />
            </button>
            <button
              v-if="sortOrder == 'asc'"
              class="_fp-btn-icon"
              @click="sortOrder = 'desc'">
              <ObIcon name="arrow-up-narrow-wide" />
            </button>
          </div>
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
                  @edit="onFlakeEdit"
                  @delete="onFlakeDelete"
                  @size-update="onFlakeSizeUpdate" />
              </div>
            </div>
          </div>

          <div v-if="flow == 'horizontal'" class="horizontal-view">
            <div class="horizontal-flow">
              <FlakeView v-for="flake of sortedFlakes"
                :key="flake.id"
                :flake="flake"
                :style="{ width: `${columnWidth}px` }"
                @edit="onFlakeEdit"
                @delete="onFlakeDelete"
                @size-update="onFlakeSizeUpdate" />
            </div>
          </div>

          <div
            v-if="unrenderedFlakes.length"
            class="flake-renderer"
            :style="{ width: `${columnWidth}px` }">
            <FlakeView v-for="flake of unrenderedFlakes"
              :key="flake.id"
              :flake="flake"
              @size-init="onFlakeSizeInit" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../globals.scss' as *;

.view-layout {
  @extend %fp-inset;
  position: fixed;
  top: var(--header-height);

  display: grid;
  grid-template-rows: min-content auto;

  >.header {
    padding: 0.5em 1em;
  }

  >.content {
    position: relative;
  }
}

.sub-layout {
  @extend %fp-inset;
  position: absolute;
  background-color: var(--background-primary-alt);

  &.-vertical {
    overflow-y: auto;
  }

  &.-horizontal {
    overflow-x: auto;
    overflow-y: hidden;
  }
}

.file-name {
  margin: 0;
  margin-bottom: 0.375em;
  user-select: text;

  &.-faint {
    opacity: 10%;
  }
}

%fp-tools {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 0.75em;

  font-size: var(--font-small);
}

.tools-main {
  @extend %fp-tools;
  position: relative;
}

.tools-sub {
  @extend %fp-tools;
  position: absolute;

  justify-content: end;
  top: calc(-100% - 1em);
  padding: 0.5em 0;
}

.tool-item {
  display: flex;
  align-items: center;
  column-gap: 0.5em;

  &.-grow {
    flex-grow: 1;
  }

  >.wfull {
    width: 100%;
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

  >.column {
    display: flex;
    flex-direction: column;
    row-gap: 1em;
  }
}

.horizontal-view {
  display: flex;
  height: 100%;
}

.horizontal-flow {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  flex-wrap: wrap;
  column-gap: 1em;
  row-gap: 1em;
  padding: 0.5em 2em 0.5em 1em;
}

.flake-renderer {
  visibility: hidden;
}
</style>
