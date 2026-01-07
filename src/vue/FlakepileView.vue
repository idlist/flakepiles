<script setup lang="ts">
import { computed, inject, nextTick, provide, ref, useTemplateRef, watch } from 'vue'
import { useElementSize, useMediaQuery } from '@vueuse/core'
import { createFlake, FLAKE_WIDTH, type Flake, type Flakepile } from '@/data'
import type { FileRef, PileShallowRef } from '@/app'
import { ObIcon, ObSearch } from '@/components'
import VerticalFlow from './flows/VerticalFlow.vue'
import HorizontalFlow from './flows/HorizontalFlow.vue'

const props = defineProps<{
  pile: PileShallowRef
}>()
const pile = props.pile

const fileRef = inject('fileRef') as FileRef
const requestSave = inject('requestSave') as () => void

const usePileProp = <K extends keyof Flakepile>(key: K) => {
  return computed({
    get: () => pile.value[key],
    set: (value: Flakepile[K]) => {
      pile.value[key] = value
      requestSave()
    },
  })
}

const flow = usePileProp('flow')
const sortBy = usePileProp('sortBy')
const sortOrder = usePileProp('sortOrder')

const isMobile = useMediaQuery('(max-width: 640px)')
const adaptiveFlow = computed(() => {
  return isMobile.value ? 'mobile' : flow.value
})

const isSubMenuOpen = ref(false)

watch(() => pile.value.id, () => {
  isSubMenuOpen.value = false
})

const refContent = useTemplateRef('el-content')
const size = useElementSize(refContent)
const columnWidth = computed(() => FLAKE_WIDTH * pile.value.width)

const refVerticalFlow = useTemplateRef('el-vertical-flow')

const searchQueue = ref<string>('')

const name = computed<string>(() => {
  return fileRef.value?.basename ?? ''
})

const addFlake = () => {
  var flake = createFlake()
  pile.value.flakes.push(flake)
  requestSave()
}

const requestDelete = async (id: string) => {
  const index = pile.value.flakes.findIndex((flake) => flake.id == id)
  if (index == -1) return
  pile.value.flakes.splice(index, 1)
  requestSave()

  if (refVerticalFlow.value) {
    await nextTick()
    refVerticalFlow.value.arrangeFlakesWithout(id)
  }
}

provide('requestDelete', requestDelete)

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

        <button v-if="!isSubMenuOpen" class="_fp-btn-icon">
          <ObIcon name="square-menu" @click="isSubMenuOpen = true" />
        </button>

        <button v-else class="_fp-btn-icon">
          <ObIcon name="cross" @click="isSubMenuOpen = false" />
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
          <VerticalFlow v-if="adaptiveFlow == 'vertical'"
            ref="el-vertical-flow"
            :flakes="sortedFlakes"
            :column-width="columnWidth"
            :viewport-width="size.width.value" />

          <HorizontalFlow v-else-if="adaptiveFlow == 'horizontal'"
            :flakes="sortedFlakes"
            :column-width="columnWidth" />
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
</style>
