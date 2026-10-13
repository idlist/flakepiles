<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import { type FlakeLabel, type Flakepile, type FlakepileAdaptiveFlow, type FlakepileMeta } from '@/schemes/v1'
import { type Point, type Size, useCssWith } from '@/utils'
import { refDebounced, useElementBounding, useElementSize, watchThrottled } from '@vueuse/core'
import LayoutMasonry from './flakepile-app/LayoutMasonry.vue'
import MenuDefault from './flakepile-app/MenuDefault.vue'
import MenuExpanded from './flakepile-app/MenuExpanded.vue'
import MenuShrinked from './flakepile-app/MenuShrinked.vue'

import {
  computed,
  type ComputedRef,
  inject,
  onMounted,
  provide,
  type Ref,
  ref,
  toRef,
  useTemplateRef,
  watch,
} from 'vue'

const props = defineProps<{ pile: Flakepile }>()
const plugin = inject('plugin') as FlakepilePluginRef

const loadingState = computed(() => plugin.meta.loadingState)
const hasFlake = computed(() => props.pile.flakes.length !== 0)

const meta = toRef(props.pile.meta)
watch(meta, plugin.trySave)
provide('meta', meta)
export type FlakepileMetaRef = Ref<FlakepileMeta>

const labels = toRef(props.pile.labels)

provide('labels', labels)
export type FlakepileLabelsRef = Ref<FlakeLabel[]>

const $root = useTemplateRef('$root')
const rootSize = useElementSize($root)
const rootWidth = ref(0)

onMounted(() => {
  watchThrottled(rootSize.width, (value) => {
    rootWidth.value = value
  }, { throttle: 10 })
})

interface Environment {
  size: 'small' | 'large'
}
const env = computed<Environment>(() => ({
  size: rootWidth.value > 600 ? 'large' : 'small',
}))

provide('env', env)
export type EnvironmentRef = ComputedRef<Environment>

const flakeIdEditing = ref<string | null>(null)

watch(() => props.pile.id, () => {
  flakeIdEditing.value = null
})

provide('flakeIdEditing', flakeIdEditing)
export type FlakeIdEditingRef = Ref<string | null>

const searchQuery = ref<string>('')
const _searchQueryDebounced = refDebounced(searchQuery, 100)

const showOptions = ref(false)
const showLabels = ref(false)

const adaptiveFlow = computed<FlakepileAdaptiveFlow>(() => {
  return env.value.size === 'small' ? 'mobile' : meta.value.flow
})
const useFlow = useCssWith(adaptiveFlow, (v) => `-${v}`)

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

function newFlake() {
  const flakeId = plugin.addFlake()
  if (!flakeId) return
}
</script>

<template>
  <div ref="$root" class="flakepile-layout">
    <div class="flakepile-menu">
      <div class="menu-padding"></div>

      <MenuShrinked
        v-if="meta.menu === 'shrinked'"
        v-model="meta"
      />

      <MenuDefault
        v-if="meta.menu === 'default'"
        v-model="meta"
        v-model:query="searchQuery"
        @new="newFlake"
      />

      <MenuExpanded
        v-if="meta.menu === 'expanded'"
        v-model="meta"
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
          :flow="adaptiveFlow"
          :usable-size="usableSizeValues"
          :scroll="scroll"
          :flakes="pile.flakes"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/globals.scss" as *;

.flakepile-layout {
  position: fixed;
  inset: 0;
  top: var(--header-height);
  min-width: 400px;

  display: grid;
  grid-template-rows: min-content auto;
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
</style>
