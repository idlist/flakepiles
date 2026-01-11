<script setup lang="ts">
import { Platform } from 'obsidian'
import { computed, inject, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useElementBounding, useElementSize, watchThrottled } from '@vueuse/core'
import { offset, shift, useFloating, autoUpdate } from '@floating-ui/vue'
import { createFlake, type Flake, type PileAdaptiveFlow } from '@/data'
import type { FileRef, PileActions, PileRef } from '@/app'
import { ObIcon, ObSearch } from '@/components'

import MenuButton from './MenuButton.vue'
import SortOptions from './SortOptions.vue'
import MasonryUnified from './MasonryUnified.vue'
import SizeOptionsPanel from './SizeOptionsPanel.vue'
import LabelsPanel from './LabelsPanel.vue'

const props = defineProps<{
  pile: PileRef
}>()
const pile = props.pile

const fileRef = inject('fileRef') as FileRef
const actions = inject('actions') as PileActions
const name = computed<string>(() => fileRef.value?.basename ?? '')

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

const viewportRef = useTemplateRef('el-viewport')
const viewportSize = useElementSize(viewportRef)
const vw = ref(0)

onMounted(() => {
  watchThrottled(viewportSize.width, (value) => {
    vw.value = value
  }, { throttle: 10 })
})

const isDesktop = computed(() => Platform.isDesktop)
const isViewportSmall = computed(() => vw.value <= 600)
const isViewportLarge = computed(() => vw.value > 600)

const adaptiveFlow = computed<PileAdaptiveFlow>(() => {
  return isViewportSmall.value ? 'mobile' : pile.value.flow
})
const placeFlowOptions = computed(() => {
  return isDesktop.value && isViewportLarge.value
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

const isMenuExpanded = ref(false)
const showSizeOptions = ref(false)
const showLabels = ref(true)

// Reset menu and panels when changing files.
watch(() => pile.value.id, () => {
  isMenuExpanded.value = false
  showSizeOptions.value = false
  showLabels.value = false
})

// Close *some* panels when the viewport is resized to small.
watch(isViewportSmall, (small) => {
  if (small) {
    showSizeOptions.value = false
  }
})

const sizeOptionsButtonRef = useTemplateRef('el-size-options-button')
const sizeOptionsPanelRef = useTemplateRef<HTMLElement>('el-size-options-panel')
const {
  floatingStyles: sizeOptionsPanelStyles,
} = useFloating(sizeOptionsButtonRef, sizeOptionsPanelRef, {
  placement: 'bottom-end',
  middleware: [offset(4), shift({ padding: 4 })],
  whileElementsMounted: autoUpdate,
})

const labelsButtonRef = useTemplateRef<HTMLElement>('el-labels-button')
const labelsPanelRef = useTemplateRef<HTMLElement>('el-labels-panel')
const {
  floatingStyles: labelPanelStyles,
} = useFloating(labelsButtonRef, labelsPanelRef, {
  placement: 'bottom-start',
  middleware: [offset(4), shift({ padding: 4 })],
  whileElementsMounted: autoUpdate,
})

const addFlake = () => {
  var flake = createFlake()
  pile.value.flakes.push(flake)
  actions.save()

  masonryRef.value!.requestHighlight(flake.id)
  masonryRef.value!.requestScrollTo(flake.id)
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

const adaptiveToolClass = computed(() => {
  return isViewportLarge.value
    ? 'fp-btn-icon-label'
    : 'fp-btn-icon-label -nolabel'
})
</script>

<template>
  <div ref="el-viewport" class="view-layout">
    <div class="header">
      <h1 class="file-name">{{ name }}</h1>

      <div class="menu-area">
        <div v-if="!isMenuExpanded" class="menu-main">
          <MenuButton
            :class="adaptiveToolClass"
            icon="plus"
            label="Add Flake"
            @click="addFlake" />

          <ObSearch v-model="searchQueue" class="wfull" />

          <button
            class="fp-btn-icon"
            @click="isMenuExpanded = true">
            <ObIcon name="square-menu" />
          </button>
        </div>

        <div v-if="isMenuExpanded" class="menu-main">
          <MenuButton ref="el-labels-button"
            :class="adaptiveToolClass"
            icon="tags"
            label="Labels"
            @click="showLabels = !showLabels" />

          <div class="expand"></div>

          <SortOptions
            v-model:sort-by="pile.sortBy"
            v-model:sort-order="pile.sortOrder" />

          <button
            class="fp-btn-icon"
            @click="isMenuExpanded = false">
            <ObIcon name="cross" />
          </button>
        </div>

        <div v-if="isMenuExpanded" class="menu-above">
          <div v-if="isDesktop">
            <MenuButton
              :class="adaptiveToolClass"
              icon="import"
              label="Import..." />
          </div>

          <div v-if="isDesktop">
            <MenuButton
              :class="adaptiveToolClass"
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
    </div>

    <div class="content">
      <div ref="el-canvas" :class="['sub-layout', `-${adaptiveFlow}`]">
        <div v-if="!pile.flakes.length" class="no-flakes">No Flakes</div>

        <template v-else>
          <MasonryUnified
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
        </template>
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

.view-layout {
  @extend %fp-inset;
  position: fixed;
  top: var(--header-height);
  min-width: 400px;

  display: grid;
  grid-template-rows: min-content auto;

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
  overflow-x: scroll;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.file-name {
  margin: 0;
  margin-bottom: 0.375em;
  user-select: text;

  .is-mobile & {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }
}

%fp-tools {
  display: flex;
  align-items: center;
  column-gap: 0.5em;

  width: 100%;
  font-size: var(--font-ui-small);

  >.expand {
    flex-grow: 1;
  }

  >.wfull {
    width: 100%;
  }
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
</style>
