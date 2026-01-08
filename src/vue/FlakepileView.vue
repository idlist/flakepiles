<script setup lang="ts">
import { Platform } from 'obsidian'
import { computed, inject, nextTick, onMounted, provide, ref, useTemplateRef, watch } from 'vue'
import { useElementSize, useThrottleFn } from '@vueuse/core'
import { offset, shift, useFloating, autoUpdate } from '@floating-ui/vue'
import { createFlake, FLAKE_WIDTH, type Flake, type Flakepile } from '@/data'
import type { FileRef, PileShallowRef } from '@/app'
import { ObIcon, ObSearch, ObSlider } from '@/components'

import VerticalFlow from './flows/VerticalFlow.vue'
import HorizontalFlow from './flows/HorizontalFlow.vue'
import MobileFlow from './flows/MobileFlow.vue'

import MenuButton from './MenuButton.vue'
import SortOptions from './SortOptions.vue'

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
const width = usePileProp('width')
const elasticWidth = usePileProp('elasticWidth')
const enableMaxHeight = usePileProp('enableMaxHeight')
const maxHeight = usePileProp('maxHeight')
const elasticHeight = usePileProp('elasticHeight')

const columnWidth = computed(() => FLAKE_WIDTH * pile.value.width)

const refViewport = useTemplateRef('el-viewport')
const viewportSize = useElementSize(refViewport)
const vw = ref(0)

onMounted(() => {
  watch(viewportSize.width, useThrottleFn((value) => {
    vw.value = value
  }, 10, true))
})

const isDesktop = computed(() => Platform.isDesktop)
// const isMobile = computed(() => Platform.isMobile)
const isViewportSmall = computed(() => vw.value <= 600)
const isViewportLarge = computed(() => vw.value > 600)

const adaptiveFlow = computed(() => {
  return isViewportSmall.value ? 'mobile' : flow.value
})
const placeFlowOptions = computed(() => {
  return isDesktop.value && isViewportLarge.value
})
const adaptiveMenuItemClass = computed<string[]>(() => {
  return ['fp-menu-item', isViewportLarge.value ?  '-withlabel' : '-nolabel']
})

const isMenuExpanded = ref(false)

watch(() => pile.value.id, () => {
  isMenuExpanded.value = false
})

const refVerticalFlow = useTemplateRef('el-vertical-flow')

const name = computed<string>(() => {
  return fileRef.value?.basename ?? ''
})

const addFlake = () => {
  var flake = createFlake()
  pile.value.flakes.push(flake)
  requestSave()
}

const requestArrange = async () => {
  requestSave()

  if (refVerticalFlow.value) {
    await nextTick()
    refVerticalFlow.value.arrangeFlakes()
  }
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

provide('requestArrange', requestArrange)
provide('requestDelete', requestDelete)

watch(() => pile.value.id, () => {
  refVerticalFlow.value?.rerenderFlakes()
})

const searchQueue = ref<string>('')

const showSizeOptions = ref(false)

const toggleSizeOptions = () => {
  showSizeOptions.value = !showSizeOptions.value
}

const sizeOptionsButton = useTemplateRef('el-size-options-button')
const sizeOptionsPanel = useTemplateRef('el-size-options-panel')
const {
  floatingStyles: sizeOptionsPanelStyles,
} = useFloating(sizeOptionsButton, sizeOptionsPanel, {
  placement: 'bottom-end',
  middleware: [offset(4), shift({ padding: 4 })],
  whileElementsMounted: autoUpdate,
})

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

      <div class="menu-area">
        <div v-if="!isMenuExpanded" class="menu-main">
          <div :class="adaptiveMenuItemClass">
            <MenuButton icon="plus" label="Add Flake" @click="addFlake" />
          </div>

          <div class="fp-menu-item -grow">
            <ObSearch v-model="searchQueue" class="wfull" />
          </div>

          <button
            class="fp-btn-icon"
            @click="isMenuExpanded = true">
            <ObIcon name="square-menu" />
          </button>
        </div>

        <div v-if="isMenuExpanded" class="menu-main">
          <div :class="adaptiveMenuItemClass">
            <MenuButton icon="tags" label="Labels" />
          </div>

          <div class="fp-menu-item -grow"></div>

          <div :class="adaptiveMenuItemClass">
            <SortOptions
              v-model:sort-by="sortBy"
              v-model:sort-order="sortOrder" />
          </div>

          <button
            class="fp-btn-icon"
            @click="isMenuExpanded = false">
            <ObIcon name="cross" />
          </button>
        </div>

        <div v-if="isMenuExpanded" class="menu-above">
          <div v-if="isDesktop"
            :class="adaptiveMenuItemClass">
            <MenuButton icon="import" label="Import" />
          </div>

          <div v-if="isDesktop"
            :class="adaptiveMenuItemClass">
            <MenuButton icon="archive-restore" label="Export..." />
          </div>

          <div class="fp-menu-item -grow"></div>

          <div v-if="placeFlowOptions" class="fp-menu-item">
            <label>Flow</label>
            <ObIcon v-if="flow == 'vertical'" name="move-vertical" />
            <ObIcon v-if="flow == 'horizontal'" name="move-horizontal" />
            <select v-model="flow" class="dropdown">
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <div v-if="placeFlowOptions" class="fp-menu-item -withlabel">
            <MenuButton
              ref="el-size-options-button"
              icon="scaling"
              label="Size Options"
              @click="toggleSizeOptions" />
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <div :class="['sub-layout', `-${adaptiveFlow}`]">
        <div v-if="!pile.flakes.length" class="no-flakes">No Flakes</div>

        <template v-else>
          <VerticalFlow v-if="adaptiveFlow == 'vertical'"
            ref="el-vertical-flow"
            :flakes="sortedFlakes"
            :column-width="columnWidth"
            :elastic-width="elasticWidth"
            :enable-max-height="enableMaxHeight"
            :max-height="maxHeight" />

          <HorizontalFlow v-else-if="adaptiveFlow == 'horizontal'"
            :flakes="sortedFlakes"
            :column-width="columnWidth"
            :enable-max-height="enableMaxHeight"
            :max-height="maxHeight"
            :elastic-height="elasticHeight" />

          <MobileFlow v-else-if="adaptiveFlow == 'mobile'"
            :flakes="sortedFlakes"
            :column-width="columnWidth" />
        </template>
      </div>
    </div>
  </div>

  <div class="floating-container">
    <div v-if="showSizeOptions"
      ref="el-size-options-panel"
      class="fp-obsidian-panel size-options-panel"
      :style="sizeOptionsPanelStyles">
      <div class="size-option">
        <span>Width</span>
        <ObSlider v-model="width"
          :default="1"
          :min="0.5"
          :max="2"
          :step="0.05"
          class="slider" />
      </div>

      <label v-if="flow == 'vertical'" class="size-option">
        <span>Elastic Width</span>
        <input v-model="elasticWidth" type="checkbox" />
      </label>

      <hr />

      <label class="size-option">
        <span>Set Maximum Height</span>
        <input v-model="enableMaxHeight" type="checkbox" />
      </label>

      <div class="size-option">
        <span :class="['label', enableMaxHeight ? '' : '-disabled']">Height</span>
        <ObSlider v-model="maxHeight"
          :default="1"
          :min="0.5"
          :max="4"
          :step="0.1"
          :disabled="!enableMaxHeight"
          class="slider" />
      </div>

      <label v-if="flow == 'horizontal'" class="size-option">
        <span>Elastic Height</span>
        <input v-model="elasticHeight" type="checkbox" />
      </label>
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
  font-size: var(--font-text-size);

  >.header {
    position: relative;
    padding: 0.5em 1em;
    background-color: var(--background-primary);
    border-bottom: var(--border-width) solid var(--background-modifier-border);
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
  column-gap: 0.5em;
  font-size: var(--font-smaller);
}

%fp-tools-additional {
  @extend %fp-tools;
  position: absolute;
  left: 0;
  right: 0;
  z-index: 5;
  column-gap: 0.5em;

  background-color: color-mix(in srgb, var(--background-primary), transparent 10%);
}

.menu-area {
  width: 100%;
  position: relative;
}

.menu-main {
  @extend %fp-tools;
  position: relative;
}

.menu-above {
  @extend %fp-tools-additional;
  bottom: 100%;
  margin-bottom: 0.5em;
}

.no-flakes {
  width: 100%;
  padding: 1rem;
  font-style: italic;
  color: var(--text-faint);
  text-align: center;
}

.floating-container {
  @extend %fp-inset;
  position: fixed;
  z-index: 10;
  pointer-events: none;
}

.size-options-panel {
  font-size: var(--font-small);
  pointer-events: painted;

  display: grid;
  row-gap: 0.5em;
  padding: 0.75em;

  >:deep(hr) {
    margin: 0.125em 0;
  }
}

.size-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: 1em;
  padding: 0 0.25em;

  & .slider {
    width: auto;
    min-width: 120px;
  }

  >input {
    margin-inline-end: 0;
  }

  >.label.-disabled {
    color: var(--text-faint);
  }
}
</style>

<style lang="scss">
@use '../globals.scss' as *;

.fp-menu-item {
  display: flex;
  align-items: center;
  column-gap: 0.5em;

  &.-grow {
    flex-grow: 1;
  }

  &.-withlabel .button {
    @extend .fp-btn-icon-with-label;
  }

  &.-nolabel .button {
    @extend .fp-btn-icon;
  }

  &.-nolabel .label {
    display: none;
  }

  >.wfull {
    width: 100%;
  }
}
</style>
