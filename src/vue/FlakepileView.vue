<script setup lang="ts">
import { Platform, prepareFuzzySearch, prepareSimpleSearch } from 'obsidian'
import { computed, inject, onMounted, provide, ref, useTemplateRef, watch } from 'vue'
import { useElementBounding, useElementSize, watchThrottled } from '@vueuse/core'
import { offset, shift, useFloating, autoUpdate } from '@floating-ui/vue'
import { createFlake, type Flake, type PileAdaptiveFlow } from '@/data'
import type { FileRef, PileActions, PileRef } from '@/app'
import { ObIcon, ObSearch } from '@/components'
import { useCssIf, useCssWith } from '@/utils'

import MenuButton from './MenuButton.vue'
import MasonryUnified from './MasonryUnified.vue'
import SizeOptionsPanel from './SizeOptionsPanel.vue'
import LabelsPanel from './LabelsPanel.vue'

const props = defineProps<{ pile: PileRef }>()

const isDev = ref(false)
provide('isDev', isDev)

const pile = props.pile
const fileRef = inject('fileRef') as FileRef
const actions = inject('actions') as PileActions
const name = computed<string>(() => fileRef.value?.basename ?? '')

// Shallow watch `pile` doesn't work. I don't know why.
watch([
  () => pile.value.flow,
  () => pile.value.sortBy,
  () => pile.value.sortOrder,
  () => pile.value.width,
  () => pile.value.elasticWidth,
  () => pile.value.enableMaxHeight,
  () => pile.value.maxHeight,
  () => pile.value.elasticHeight,
], () => {
  actions.save()
})

const editing = ref<string | null>(null)
provide('editing', editing)

const viewportRef = useTemplateRef('el-viewport')
const viewportSize = useElementSize(viewportRef)
const vw = ref(0)

onMounted(() => {
  watchThrottled(viewportSize.width, (value) => {
    vw.value = value
  }, { throttle: 10 })
})

const isDesktop = computed(() => Platform.isDesktop)
const isPhone = computed(() => Platform.isPhone)
const isViewportSmall = computed(() => vw.value <= 600)
const isViewportLarge = computed(() => vw.value > 600)

const adaptiveFlow = computed<PileAdaptiveFlow>(() => {
  return isViewportSmall.value ? 'mobile' : pile.value.flow
})
const placeFlowOptions = computed(() => {
  return isViewportLarge.value
})

const canvasRef = useTemplateRef('el-canvas')
const canvasSize = useElementSize(canvasRef)
const canvasBounding = useElementBounding(canvasRef)

const masonryRef = useTemplateRef('el-masonry')
const masonryBounding = useElementBounding(masonryRef)

const scrollX = computed(() => {
  return canvasBounding.left.value - masonryBounding.left.value
})
const scrollY = computed(() => {
  return canvasBounding.top.value - masonryBounding.top.value
})

type MenuState = 'shrink' | 'normal' | 'expand'

const menuState = ref<MenuState>('normal')
const showSizeOptions = ref(false)
const showLabels = ref(true)

const closeAllPanels = () => {
  showSizeOptions.value = false
  showLabels.value = false
}

// Reset menu and all panels when changing files.
watch(() => pile.value.id, () => {
  menuState.value = 'normal'
  editing.value = null
  closeAllPanels()
})

// Close some panels when the viewport is resized to small.
watch(isViewportSmall, (small) => {
  if (small) {
    closeAllPanels()
  }
})

// Close some panels when entering editing mode.
watch(editing, () => {
  if (editing.value) {
    closeAllPanels()
  }
})

const sizeOptionsButtonRef = useTemplateRef('el-size-options-button')
const sizeOptionsPanelRef = useTemplateRef<HTMLElement>('el-size-options-panel')
const {
  floatingStyles: sizeOptionsPanelStyles,
} = useFloating(sizeOptionsButtonRef, sizeOptionsPanelRef, {
  placement: 'bottom-end',
  middleware: [offset(4), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
})

const labelsButtonRef = useTemplateRef<HTMLElement>('el-labels-button')
const labelsPanelRef = useTemplateRef<HTMLElement>('el-labels-panel')
const {
  floatingStyles: labelPanelStyles,
} = useFloating(labelsButtonRef, labelsPanelRef, {
  placement: 'bottom-start',
  middleware: [offset(4), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
})

const addFlake = () => {
  var flake = createFlake()
  pile.value.flakes.push(flake)
  actions.save()

  masonryRef.value!.requestEdit(flake.id)
}

const searchQueue = ref<string>('')

const sortedFlakes = computed<Flake[]>(() => {
  const sorted = [...pile.value.flakes]

  sorted.sort((a, b) => {
    if (pile.value.sortBy == 'name') {
      if (pile.value.sortOrder == 'asc') {
        return a.name.localeCompare(b.name)
      }
      else if (pile.value.sortOrder == 'desc') {
        return b.name.localeCompare(a.name)
      }
    }
    else if (pile.value.sortBy == 'createdAt') {
      if (pile.value.sortOrder == 'asc') {
        return a.createdAt - b.createdAt
      }
      else if (pile.value.sortOrder == 'desc') {
        return b.createdAt - a.createdAt
      }
    }
    else if (pile.value.sortBy == 'modifiedAt') {
      if (pile.value.sortOrder == 'asc') {
        return a.modifiedAt - b.modifiedAt
      }
      else if (pile.value.sortOrder == 'desc') {
        return b.modifiedAt - a.modifiedAt
      }
    }
    return 0
  })

  return sorted
})

const cssAdaptiveFlow = useCssWith(adaptiveFlow, (v) => `-${v}`)
const cssNoLabel = useCssIf(isViewportSmall, '-nolabel')
</script>

<template>
  <div ref="el-viewport" class="flakepile-layout">
    <div class="header">
      <div class="menu-padding"></div>

      <div v-if="menuState == 'shrink'" class="menu-shrink">
        <button
          class="fp-btn-icon"
          @click="menuState = 'normal'">
          <ObIcon name="chevrons-up-down" />
        </button>

        <h6 class="file-name-shrink">
          {{ name }}
        </h6>
      </div>

      <h1 v-if="menuState != 'shrink'" class="file-name">
        {{ name }}
      </h1>

      <div v-if="menuState != 'shrink'" class="menu-area">
        <div v-if="menuState == 'normal'" class="menu-main">
          <button v-if="!isPhone"
            class="fp-btn-icon"
            @click="menuState = 'shrink'">
            <ObIcon name="chevrons-down-up" />
          </button>

          <MenuButton
            :class="['fp-btn-icon-label', cssNoLabel]"
            icon="plus"
            label="Add Flake"
            @click="addFlake" />

          <ObSearch v-model="searchQueue" class="wfull" />

          <button
            class="fp-btn-icon"
            @click="menuState = 'expand'">
            <ObIcon name="square-menu" />
          </button>
        </div>

        <div v-if="menuState == 'expand'" class="menu-main">
          <MenuButton v-if="isDev"
            ref="el-labels-button"
            :class="['fp-btn-icon-label', cssNoLabel]"
            icon="tags"
            label="Labels"
            @click="showLabels = !showLabels" />

          <div class="expand"></div>

          <label>Sort By</label>
          <select v-model="pile.sortBy" class="dropdown">
            <option value="name">Name</option>
            <option value="createdAt">Time Created</option>
            <option value="modifiedAt">Time Modified</option>
          </select>
          <button
            v-if="pile.sortOrder == 'desc'"
            class="fp-btn-icon"
            @click="pile.sortOrder = 'asc'">
            <ObIcon name="arrow-down-wide-narrow" />
          </button>
          <button
            v-if="pile.sortOrder == 'asc'"
            class="fp-btn-icon"
            @click="pile.sortOrder = 'desc'">
            <ObIcon name="arrow-up-narrow-wide" />
          </button>

          <button
            class="fp-btn-icon"
            @click="menuState = 'normal'">
            <ObIcon name="cross" />
          </button>
        </div>

        <div v-if="menuState == 'expand'" class="menu-expand">
          <div v-if="isDesktop && isDev">
            <MenuButton
              :class="['fp-btn-icon-label', cssNoLabel]"
              icon="import"
              label="Import..." />
          </div>

          <div v-if="isDesktop && isDev">
            <MenuButton
              :class="['fp-btn-icon-label', cssNoLabel]"
              icon="archive-restore"
              label="Export..." />
          </div>

          <div class="expand"></div>

          <template v-if="placeFlowOptions">
            <label>Flow</label>
            <ObIcon v-if="pile.flow == 'vertical'" name="move-vertical" />
            <ObIcon v-if="pile.flow == 'horizontal'" name="move-horizontal" />
            <select v-model="pile.flow" class="dropdown">
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>

            <MenuButton ref="el-size-options-button"
              class="fp-btn-icon-label"
              icon="scaling"
              label="Size Options"
              @click="showSizeOptions = !showSizeOptions" />
          </template>
        </div>
      </div>

      <div v-if="editing" class="header-masking"></div>
    </div>

    <div class="content">
      <div ref="el-canvas" :class="['sub-layout', cssAdaptiveFlow]">
        <div v-if="!pile.flakes.length" class="no-flakes">No Flakes</div>

        <MasonryUnified v-else
          :id="pile.id"
          ref="el-masonry"
          :flakes="sortedFlakes"
          :flow="adaptiveFlow"
          :scroll-x="scrollX"
          :scroll-y="scrollY"
          :options="{
            width: pile.width,
            elasticWidth: pile.elasticWidth,
            enableMaxHeight: pile.enableMaxHeight,
            maxHeight: pile.maxHeight,
            elasticHeight: pile.elasticHeight,
            canvasWidth: canvasSize.width.value,
            canvasHeight: canvasSize.height.value,
          }" />
      </div>
    </div>
  </div>

  <div class="floating-container">
    <SizeOptionsPanel v-if="showSizeOptions"
      ref="el-size-options-panel"
      v-model:width="pile.width"
      v-model:elastic-width="pile.elasticWidth"
      v-model:enable-max-height="pile.enableMaxHeight"
      v-model:max-height="pile.maxHeight"
      v-model:elastic-height="pile.elasticHeight"
      :flow="pile.flow"
      :style="sizeOptionsPanelStyles" />

    <LabelsPanel v-if="showLabels"
      ref="el-labels-panel"
      :style="labelPanelStyles" />
  </div>
</template>

<style lang="scss" scoped>
@use '../globals.scss' as *;

.flakepile-layout {
  @extend .fp-inset;
  position: fixed;
  top: var(--header-height);
  min-width: 400px;

  display: grid;
  grid-template-rows: min-content auto;

  >.header {
    position: relative;
    overflow-x: hidden;

    padding: var(--size-4-2) var(--size-4-4);
    background-color: var(--background-primary);
    border-bottom: var(--border-width) solid var(--background-modifier-border);
  }

  .is-phone &>.header,
  .is-tablet &>.header {
    padding: var(--size-4-2) var(--size-4-3);
  }

  >.content {
    position: relative;
    background-color: var(--background-primary-alt);
  }
}

.header-masking {
  @extend .fp-inset;
  position: absolute;
  z-index: 20;

  background-color: color-mix(in srgb, var(--background-primary), transparent 25%);
}

.sub-layout {
  @extend .fp-inset;
  position: absolute;

  overflow-y: auto;
  scrollbar-gutter: stable;
}

.menu-shrink {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-2);
}

%file-name-ellipsis {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: text;
}

.file-name-shrink {
  @extend %file-name-ellipsis;
  margin: 0;
}

.file-name {
  @extend %file-name-ellipsis;
  margin: 0;
  margin-bottom: var(--size-4-2);

  .is-phone & {
    display: none;
  }

  .is-tablet & {
    margin-top: var(--size-4-2);
  }
}

.menu-padding {
  display: none;

  .is-phone & {
    display: block;
    padding-bottom: var(--size-4-16);
  }

  .is-tablet & {
    display: block;
    padding-bottom: var(--size-4-2);
  }
}

.menu-area {
  width: 100%;
  position: relative;
}

.menu-main {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  width: 100%;
  font-size: var(--font-ui-small);

  >.expand {
    flex-grow: 1;
  }

  >.wfull {
    width: 100%;
  }
}

.menu-expand {
  @extend .menu-main;
  position: absolute;
  left: 0;
  right: 0;
  z-index: 5;
  column-gap: var(--size-4-1);

  bottom: 100%;
  margin-bottom: var(--size-4-1);
  background-color: color-mix(in srgb, var(--background-primary), transparent 10%);
}

.no-flakes {
  width: 100%;
  padding: 1rem;
  font-style: italic;
  color: var(--text-faint);
  text-align: center;
}

.floating-container {
  @extend .fp-inset;
  position: fixed;
  z-index: 10;
  pointer-events: none;
}
</style>
