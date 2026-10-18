<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake, FlakeLabel, Flakepile, FlakepileAdaptiveFlow } from '@/schemes/common'
import { useCssWith } from '@/use'
import { idFloatingArea, type Point, type Rect, type Size } from '@/utils'
import { refDebounced, useElementBounding, useElementSize, watchThrottled } from '@vueuse/core'
import { computed, inject, nextTick, onMounted, provide, ref, useTemplateRef, watch } from 'vue'
import LayoutMasonry from './flakepile-app/LayoutMasonry.vue'
import MenuDefault from './flakepile-app/MenuDefault.vue'
import MenuExpanded from './flakepile-app/MenuExpanded.vue'
import MenuShrinked from './flakepile-app/MenuShrinked.vue'
import { bus } from './logic/event-bus'
import { arrangeFlakes } from './logic/query'

const props = defineProps<{ pile: Flakepile }>()
const plugin = inject('plugin') as FlakepilePluginRef

const loadingState = computed(() => plugin.meta.loadingState)
const hasFlake = computed(() => props.pile.flakes.length !== 0)

const meta = computed(() => props.pile.meta)
provide('meta', meta)
export type FlakepileMetaRef = typeof meta

const labels = computed(() => props.pile.labels)
provide('labels', labels)
export type FlakepileLabelsRef = typeof labels

const flakeIdUnderEdit = ref<string | null>(null)
provide('flakeIdUnderEdit', flakeIdUnderEdit)
export type FlakeIdUnderEditRef = typeof flakeIdUnderEdit

/* Responsive Layout */

const $viewport = useTemplateRef('$viewport')
const viewportSize = useElementSize($viewport)
const viewportWidth = ref(0)

onMounted(() => {
  watchThrottled(viewportSize.width, (value) => {
    viewportWidth.value = value
  }, { throttle: 100 })
})

interface Environment {
  size: 'small' | 'large'
}
const env = computed<Environment>(() => ({
  size: viewportWidth.value > 600 ? 'large' : 'small',
}))
provide('env', env)
export type EnvironmentRef = typeof env

const flowAdaptive = computed<FlakepileAdaptiveFlow>(() => {
  return env.value.size === 'small' ? 'mobile' : meta.value.flow
})
const withFlow = useCssWith(flowAdaptive, (val) => `-${val}`)

/* Viewport Management */

const $usable = useTemplateRef('$usable')
const usableBounding = useElementBounding($usable)

const $masonry = useTemplateRef('$masonry')
const masonryBounding = useElementBounding($masonry)

const scroll = computed<Point>(() => ({
  x: usableBounding.left.value - masonryBounding.left.value,
  y: usableBounding.top.value - masonryBounding.top.value,
}))

const usableSize = useElementSize($usable)
const usableSizeValues = computed<Size>(() => ({
  width: usableSize.width.value,
  height: usableSize.height.value,
}))

const $floatingArea = useTemplateRef('$floatingArea')
const floatingAreaBounding = useElementBounding($floatingArea)
const floatingAreaRect = computed<Rect>(() => ({
  x: floatingAreaBounding.x.value,
  y: floatingAreaBounding.y.value,
  width: floatingAreaBounding.width.value,
  height: floatingAreaBounding.height.value,
}))
provide('floatingAreaRect', floatingAreaRect)
export type FloatingAreaRect = typeof floatingAreaRect

provide('$floatingArea', $floatingArea)
export type $FloatingAreaRef = typeof $floatingArea

/* Variables */

const searchQuery = ref<string>('')
const searchQueryDebounced = refDebounced(searchQuery, 100)

const showMenuMask = ref(false)
const showOptions = ref(false)
const showLabels = ref(false)

/* Element State Tweaks */

// Wwhen Flakepile changes:
watch(() => props.pile.id, () => {
  // Reset editing state (without saving).
  flakeIdUnderEdit.value = null

  // Close panels.
  showOptions.value = false
  showLabels.value = false
})

// When start editing:
watch(flakeIdUnderEdit, (val, old) => {
  if (val != null && val !== old) {
    // Close panels.
    showOptions.value = false
    showLabels.value = false
  }

  // Mask the menu
  showMenuMask.value = val != null
})

/* Flake Management */

const labelMap = computed(() => {
  const map = new Map<string, FlakeLabel>()

  for (const label of labels.value) {
    map.set(label.id, label)
  }

  return map
})

const flakesArranged = computed<Flake[]>(() => {
  const arranged = arrangeFlakes(
    props.pile.flakes,
    meta.value,
    labelMap.value,
    searchQueryDebounced.value,
  )

  return arranged
})

async function newFlake() {
  const flakeId = plugin.addFlake()
  if (!flakeId) return

  flakeIdUnderEdit.value = flakeId

  await nextTick()
  bus.emit('scroll-to', flakeId)
}
</script>

<template>
  <div ref="$viewport" class="flakepile-app">
    <div class="layout">
      <div class="flakepile-menu">
        <MenuShrinked
          v-if="meta.menu === 'shrinked'"
          :meta="meta"
        />

        <MenuDefault
          v-if="meta.menu === 'default'"
          :meta="meta"
          v-model="searchQuery"
          @new="newFlake"
        />

        <MenuExpanded
          v-if="meta.menu === 'expanded'"
          :meta="meta"
          :flow="flowAdaptive"
          v-model:show-options="showOptions"
          v-model:show-labels="showLabels"
        />

        <div v-if="showMenuMask" class="menu-masking"></div>
      </div>

      <div class="flakepile-content">
        <div ref="$usable" :class="['usable-area', withFlow]">
          <div
            v-if="loadingState === 'swapping'"
            class="layout-swapping"
          >
            Loading Flakes...
          </div>

          <div
            v-if="loadingState === 'success' && !hasFlake"
            class="layout-none"
          >
            No Flakes.
          </div>

          <LayoutMasonry
            v-if="loadingState === 'success' && hasFlake"
            ref="$masonry"
            :id="pile.id"
            :flow="flowAdaptive"
            :usable-size="usableSizeValues"
            :scroll="scroll"
            :flakes="flakesArranged"
          />
        </div>
      </div>

      <div class="floating-panels">
        <div
          :id="idFloatingArea"
          class="floating-area"
          ref="$floatingArea"
        >
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/globals.scss" as *;

.flakepile-app {
  position: fixed;
  inset: 0;
  top: var(--header-height);

  .layout {
    position: relative;
    width: 100%;
    height: 100%;

    display: grid;
    grid-template-rows: min-content auto;
  }

  .is-phone & {
    padding-top: calc(var(--safe-area-inset-top) + var(--size-4-1));
  }

  .is-tablet & {
    padding-top: var(--size-4-2);
  }
}

.flakepile-menu {
  position: relative;
  overflow-x: hidden;

  padding: var(--size-4-2) var(--size-4-4);
  background-color: var(--background-primary);

  border: none;
  border-bottom: var(--border-width) solid var(--background-modifier-border);
}

.menu-masking {
  position: absolute;
  inset: 0;
  z-index: 32;

  background-color: color-mix(
    in srgb,
    var(--background-primary),
    transparent 25%
  );
}

.flakepile-content {
  position: relative;
  background-color: var(--background-primary-alt);
}

.usable-area {
  position: absolute;
  inset: 0;

  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
}

.layout-swapping {
  width: 100%;
  padding: 1rem;

  color: var(--text-faint);
  text-align: center;
}

.layout-none {
  width: 100%;
  padding: 1rem;

  color: var(--text-faint);
  text-align: center;
  font-style: italic;
}

.floating-panels {
  position: absolute;
  inset: 0;

  z-index: 64;
  pointer-events: none;
}

.floating-area {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
