<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake, Flakepile, FlakepileAdaptiveFlow, FlakepileMeta } from '@/schemes/v1'
import { useCssWith } from '@/use.ts'
import type { Point, Size } from '@/utils'
import { refDebounced, useElementBounding, useElementSize, watchThrottled } from '@vueuse/core'
import { computed, inject, onMounted, provide, ref, useTemplateRef, watch } from 'vue'
import LayoutMasonry from './flakepile-app/LayoutMasonry.vue'
import MenuDefault from './flakepile-app/MenuDefault.vue'
import MenuExpanded from './flakepile-app/MenuExpanded.vue'
import MenuShrinked from './flakepile-app/MenuShrinked.vue'

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

const $root = useTemplateRef('$root')
const rootSize = useElementSize($root)
const rootWidth = ref(0)

onMounted(() => {
  watchThrottled(rootSize.width, (value) => {
    rootWidth.value = value
  }, { throttle: 100 })
})

interface Environment {
  size: 'small' | 'large'
}
const env = computed<Environment>(() => ({
  size: rootWidth.value > 600 ? 'large' : 'small',
}))
provide('env', env)
export type EnvironmentRef = typeof env

const flakeIdEditing = ref<string | null>(null)
provide('flakeIdEditing', flakeIdEditing)
export type FlakeIdEditingRef = typeof flakeIdEditing

const searchQuery = ref<string>('')
const _searchQueryDebounced = refDebounced(searchQuery, 100)

const showOptions = ref(false)
const showLabels = ref(false)

const flowAdaptive = computed<FlakepileAdaptiveFlow>(() => {
  return env.value.size === 'small' ? 'mobile' : meta.value.flow
})
const useFlow = useCssWith(flowAdaptive, (val) => `-${val}`)

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

// Reset editing state and close panels when Flakepile changes.
watch(() => props.pile.id, () => {
  flakeIdEditing.value = null
  showOptions.value = false
  showLabels.value = false
})

// Close panels when start editing.
watch(flakeIdEditing, (val, old) => {
  if (val == null) return
  if (val === old) return

  showOptions.value = false
  showLabels.value = false
})

type FlakeComparator = (a: Flake, b: Flake) => number

function getFlakeComparator(meta: FlakepileMeta): FlakeComparator {
  if (meta.sortBy === 'createdAt') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.meta.createdAt - b.meta.createdAt
    } else {
      return (a, b) => b.meta.createdAt - a.meta.createdAt
    }
  }
  if (meta.sortBy === 'modifiedAt') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.meta.modifiedAt - b.meta.modifiedAt
    } else {
      return (a, b) => b.meta.modifiedAt - a.meta.modifiedAt
    }
  }
  if (meta.sortBy === 'content') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.content.localeCompare(b.content)
    } else {
      return (a, b) => b.content.localeCompare(a.content)
    }
  }

  return () => 0
}

const flakesArranged = computed<Flake[]>(() => {
  const comparator = getFlakeComparator(meta.value)

  const pinned = props.pile.flakes.filter((flake) => flake.meta.pinned)
  const unpinned = props.pile.flakes.filter((flake) => !flake.meta.pinned)

  pinned.sort(comparator)
  unpinned.sort(comparator)

  return [...pinned, ...unpinned]
})

function newFlake() {
  const flakeId = plugin.addFlake()
  if (!flakeId) return
}
</script>

<template>
  <div ref="$root" class="flakepile-app">
    <div class="layout">
      <div class="flakepile-menu">
        <div class="menu-padding"></div>

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

        <div v-if="false" class="header-masking"></div>
      </div>

      <div class="flakepile-content">
        <div ref="$usable" :class="['usable-area', useFlow]">
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
        <div id="floating-area" class="floating-area"></div>
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
  min-width: 400px;

  .layout {
    position: relative;
    width: 100%;
    height: 100%;

    display: grid;
    grid-template-rows: min-content auto;
  }
}

.flakepile-menu {
  position: relative;
  overflow-x: hidden;

  padding: var(--size-4-2) var(--size-4-4);
  background-color: var(--background-primary);
  border-bottom: var(--fp-border);

  .is-phone &,
  .is-tablet & {
    padding: var(--size-4-2) var(--size-4-3);
  }
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
  scrollbar-gutter: stable;
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

  z-index: 16;
  pointer-events: none;
}

.floating-area {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
