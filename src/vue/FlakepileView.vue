<script setup lang="ts">
import { Platform } from 'obsidian'
import { computed, inject, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useElementBounding, useElementSize, watchThrottled } from '@vueuse/core'
import { offset, shift, useFloating, autoUpdate } from '@floating-ui/vue'
import { createFlake, type Flake } from '@/data'
import type { FileRef, PileActions, PileRef } from '@/app'
import { ObIcon, ObSearch, ObSlider } from '@/components'

import MenuButton from './MenuButton.vue'
import SortOptions from './SortOptions.vue'
import MasonryUnified from './MasonryUnified.vue'

const props = defineProps<{
  pile: PileRef
}>()
const pile = props.pile

const fileRef = inject('fileRef') as FileRef
const actions = inject('actions') as PileActions

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

const adaptiveFlow = computed(() => {
  return isViewportSmall.value ? 'mobile' : pile.value.flow
})
const placeFlowOptions = computed(() => {
  return isDesktop.value && isViewportLarge.value
})
const adaptiveMenuItemClass = computed<string[]>(() => {
  return ['fp-menu-item', isViewportLarge.value ? '-withlabel' : '-nolabel']
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

watch(() => pile.value.id, () => {
  isMenuExpanded.value = false
  showSizeOptions.value = false
})

watch(isViewportSmall, (small) => {
  if (small) {
    showSizeOptions.value = false
  }
})

const name = computed<string>(() => {
  return fileRef.value?.basename ?? ''
})

const addFlake = () => {
  var flake = createFlake()
  pile.value.flakes.push(flake)
  actions.save()

  masonryRef.value!.requestHighlight(flake.id)
  masonryRef.value!.requestScrollTo(flake.id)
}

const searchQueue = ref<string>('')

const showSizeOptions = ref(false)

const toggleSizeOptions = () => {
  showSizeOptions.value = !showSizeOptions.value
}

const sizeOptionsButtonRef = useTemplateRef('el-size-options-button')
const sizeOptionsPanelRef = useTemplateRef('el-size-options-panel')
const {
  floatingStyles: sizeOptionsPanelStyles,
} = useFloating(sizeOptionsButtonRef, sizeOptionsPanelRef, {
  placement: 'bottom-end',
  middleware: [offset(4), shift({ padding: 4 })],
  whileElementsMounted: autoUpdate,
})

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
              v-model:sort-by="pile.sortBy"
              v-model:sort-order="pile.sortOrder" />
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
            <ObIcon v-if="pile.flow == 'vertical'" name="move-vertical" />
            <ObIcon v-if="pile.flow == 'horizontal'" name="move-horizontal" />
            <select v-model="pile.flow" class="dropdown">
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
    <div v-if="showSizeOptions"
      ref="el-size-options-panel"
      class="fp-obsidian-panel size-options-panel"
      :style="sizeOptionsPanelStyles">
      <div class="size-option">
        <span>Width</span>
        <ObSlider v-model="pile.width"
          :default="1"
          :min="0.5"
          :max="2"
          :step="0.05"
          class="slider" />
      </div>

      <label v-if="pile.flow == 'vertical'" class="size-option">
        <span>Elastic Width</span>
        <input v-model="pile.elasticWidth" type="checkbox" />
      </label>

      <hr />

      <label class="size-option">
        <span>Set Maximum Height</span>
        <input v-model="pile.enableMaxHeight" type="checkbox" />
      </label>

      <div :class="['size-option', pile.enableMaxHeight ? '' : '-disabled']">
        <span class="label">Height</span>
        <ObSlider v-model="pile.maxHeight"
          :default="1"
          :min="0.4"
          :max="2.5"
          :step="0.05"
          :disabled="!pile.enableMaxHeight"
          class="slider" />
      </div>

      <label v-if="pile.flow == 'horizontal'"
        :class="['size-option', pile.enableMaxHeight ? '' : '-disabled']">
        <span class="label">Elastic Height</span>
        <input v-model="pile.elasticHeight"
          type="checkbox"
          :disabled="!pile.enableMaxHeight" />
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

  & input[type=checkbox]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.-disabled>.label {
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
