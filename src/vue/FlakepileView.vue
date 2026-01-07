<script setup lang="ts">
import { Platform } from 'obsidian'
import { computed, inject, nextTick, provide, ref, useTemplateRef, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { createFlake, FLAKE_WIDTH, type Flake, type Flakepile } from '@/data'
import type { FileRef, PileShallowRef } from '@/app'
import { ObIcon, ObSearch } from '@/components'
import VerticalFlow from './flows/VerticalFlow.vue'
import HorizontalFlow from './flows/HorizontalFlow.vue'
import MobileFlow from './flows/MobileFlow.vue'
import ToolSorting from './ToolSorting.vue'

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

const refViewport = useTemplateRef('el-viewport')
const viewportSize = useElementSize(refViewport)
const vw = computed(() => viewportSize.width.value)

const isViewportSmall = computed(() => {
  return Platform.isDesktop && vw.value <= 480
})
const isViewportMedium = computed(() => {
  return Platform.isDesktop && vw.value > 480 && vw.value <= 720
})
const isViewportLarge = computed(() => {
  return Platform.isDesktop && vw.value > 720
})
const isPhone = computed(() => {
  return Platform.isMobile && vw.value <= 600
})
const isTablet = computed(() => {
  return Platform.isMobile && vw.value > 600
})

const adaptiveFlow = computed(() => {
  return isViewportSmall.value || isPhone.value ? 'mobile' : flow.value
})
const placeSortOptions = computed(() => {
  return isViewportSmall.value || isViewportLarge.value || isPhone.value
})
const placeLayoutOptions = computed(() => {
  return isViewportMedium.value || isViewportLarge.value || isTablet.value
})

const isSubMenuOpen = ref(false)

watch(() => pile.value.id, () => {
  isSubMenuOpen.value = false
})

const refContent = useTemplateRef('el-content')
const contentSize = useElementSize(refContent)
const columnWidth = computed(() => FLAKE_WIDTH * pile.value.width)

const refVerticalFlow = useTemplateRef('el-vertical-flow')

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

const searchQueue = ref<string>('')

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
  <div ref="el-viewport" class="view-layout">
    <div class="header">
      <h1 class="file-name">{{ name }}</h1>

      <div class="tools-area">
        <div class="tools-main">
          <button class="_fp-btn-icon-at-left" @click="addFlake">
            <ObIcon name="plus" /> Add Flake
          </button>

          <div class="tool-item -grow">
            <ObSearch v-model="searchQueue" class="wfull" />
          </div>

          <button v-if="!isSubMenuOpen"
            class="_fp-btn-icon"
            @click="isSubMenuOpen = true">
            <ObIcon name="square-menu" />
          </button>

          <button v-else
            class="_fp-btn-icon"
            @click="isSubMenuOpen = false">
            <ObIcon name="cross" />
          </button>
        </div>

        <div v-if="isSubMenuOpen" class="tools-above">
          <button class="_fp-btn-icon-at-left">
            <ObIcon name="tags" /> Labels
          </button>

          <div class="tool-item -grow"></div>

          <button v-if="placeLayoutOptions"
            class="_fp-btn-icon-at-left">
            <ObIcon name="scaling" /> Size Options
          </button>

          <div v-if="placeLayoutOptions"
            class="tool-item">
            <label>Flow</label>
            <ObIcon v-if="flow == 'vertical'" name="move-vertical" />
            <ObIcon v-if="flow == 'horizontal'" name="move-horizontal" />
            <select v-model="flow" class="dropdown">
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <ToolSorting v-if="placeSortOptions"
            v-model:sort-by="sortBy"
            v-model:sort-order="sortOrder"
            class="tool-item" />
        </div>
      </div>

      <div v-if="isSubMenuOpen && !placeSortOptions" class="tools-below">
        <div class="tool-item -grow"></div>

        <ToolSorting v-if="!placeSortOptions"
          v-model:sort-by="sortBy"
          v-model:sort-order="sortOrder"
          class="tool-item" />
      </div>
    </div>

    <div ref="el-content" class="content">
      <div :class="['sub-layout', `-${adaptiveFlow}`]">
        <div v-if="!pile.flakes.length" class="no-flakes">No Flakes</div>

        <template v-else>
          <VerticalFlow v-if="adaptiveFlow == 'vertical'"
            ref="el-vertical-flow"
            :flakes="sortedFlakes"
            :column-width="columnWidth"
            :container-width="contentSize.width.value" />

          <HorizontalFlow v-else-if="adaptiveFlow == 'horizontal'"
            :flakes="sortedFlakes"
            :column-width="columnWidth" />

          <MobileFlow v-else-if="adaptiveFlow == 'mobile'"
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
    position: relative;
    padding: 0.5em 1em;
    background-color: var(--background-primary);
  }

  >.content {
    position: relative;
    background-color: var(--background-primary-alt);
  }
}

.sub-layout {
  @extend %fp-inset;
  position: absolute;

  &.-vertical {
    overflow-y: auto;
  }

  &.-horizontal {
    overflow-x: auto;
    overflow-y: hidden;
  }

  &.-mobile {
    overflow-y: auto;
  }
}

.file-name {
  margin: 0;
  margin-bottom: 0.375em;
  user-select: text;

  &.-faint {
    opacity: 0.1
  }

  .is-mobile & {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }
}

%fp-tools {
  width: 100%;
  display: flex;
  align-items: center;
  column-gap: 0.75em;
  font-size: var(--font-small);

  .is-mobile & {
    column-gap: 0.5em;
  }
}

%fp-tools-additional {
  @extend %fp-tools;
  position: absolute;
  left: 0;
  right: 0;
  z-index: 5;

  background-color: color-mix(in srgb, var(--background-primary), transparent 10%);
}

.tools-area {
  width: 100%;
  position: relative;
}

.tools-main {
  @extend %fp-tools;
  position: relative;
}

.tools-above {
  @extend %fp-tools;
  @extend %fp-tools-additional;
  bottom: 100%;
  margin-bottom: 0.5em;

  .is-phone & {
    position: static;
    margin-top: 0.5em;
    margin-bottom: 0;
  }
}

.tools-below {
  @extend %fp-tools;
  @extend %fp-tools-additional;
  top: 100%;
  padding: 0 1em 0.5em 1em;

  .is-phone & {
    display: none;
  }
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
