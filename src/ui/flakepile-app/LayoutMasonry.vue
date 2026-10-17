<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import { type Flake, type FlakepileAdaptiveFlow } from '@/schemes/common'
import type { FlakeIdUnderEditRef, FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { bus } from '@/ui/logic/event-bus.ts'
import { type ComputedMasonry, computeInitialWidth, computeMasonry, getDesign } from '@/ui/masonry/entry'
import { type Point, point, px, type Size } from '@/utils'
import { useThrottleFn, useTimeoutFn } from '@vueuse/core'
import { Platform } from 'obsidian'
import { computed, inject, nextTick, provide, ref, shallowRef, type StyleValue, watch } from 'vue'
import FlakeEdit from './FlakeEdit.vue'
import FlakeView from './FlakeView.vue'

const props = defineProps<{
  id: string
  flow: FlakepileAdaptiveFlow
  usableSize: Size
  scroll: Point
  flakes: Flake[]
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const flakeIdUnderEdit = inject('flakeIdUnderEdit') as FlakeIdUnderEditRef
const meta = inject('meta') as FlakepileMetaRef

const flakesUnderView = computed<Flake[]>(() => {
  return props.flakes.filter((f) => f.id !== flakeIdUnderEdit.value)
})

const flakeUnderEdit = computed<Flake | null>(() => {
  const found = props.flakes.find((f) => f.id === flakeIdUnderEdit.value)
  return typeof found !== 'undefined' ? found : null
})

/* Masonry Layout */

const heights = computed(() => plugin.heightCache.value?.heights ?? {})
const resolvedMasonry = shallowRef<ComputedMasonry>()
const heightUnderEdit = ref(0)

/** A signal for Flakes to recognize if the layout has stabilized,
    so that the Flakes can perform actions like scrolling into view. */
const isLayoutStable = ref(false)
provide('isLayoutStable', isLayoutStable)
export type IsLayoutStableRef = typeof isLayoutStable

const stableTimerHandler = useTimeoutFn(() => {
  isLayoutStable.value = true
}, 100)

async function resolveMasonry() {
  // Do not recalculate layout when some Flake is being edit.
  if (flakeIdUnderEdit.value != null) return

  // Mark the layout to be unstable.
  isLayoutStable.value = false

  // Always wait for the next tick.
  await nextTick()

  resolvedMasonry.value = computeMasonry(props.flow, {
    ids: props.flakes.map((f) => f.id),
    heights: heights.value,
    meta: meta.value,
    usableSize: props.usableSize,
  })

  stableTimerHandler.start()
}

// The purpose of throttling is to run only 1 time
// when everyone is calling the function at the same time.
const resolveMasonryThrottled = useThrottleFn(resolveMasonry, 10, true)

watch(
  heights,
  resolveMasonryThrottled,
  { immediate: true, deep: true },
)

watch(
  [
    () => props.id,
    () => props.flow,
    () => props.flakes,
    () => props.usableSize.width,
    () => props.usableSize.height,
    () => meta.value.width,
    () => meta.value.elasticWidth,
    () => meta.value.enableMaxHeight,
    () => meta.value.maxHeight,
    () => meta.value.elasticHeight,
    () => meta.value.showLabels,
    () => meta.value.showTimes,
  ],
  resolveMasonryThrottled,
  { immediate: true },
)

const flakeWidth = computed(() => {
  return computeInitialWidth(props.flow, meta.value, props.usableSize)
})

const stylesUnderView = computed<Map<string, StyleValue>>(() => {
  const styles = new Map<string, StyleValue>()
  const rects = resolvedMasonry.value?.rects

  for (const flake of flakesUnderView.value) {
    const rect = rects?.get(flake.id)

    if (rect) {
      styles.set(flake.id, {
        translate: point(rect.x, rect.y),
        width: px(rect.width),
        height: px(rect.height),
      })
    } else {
      styles.set(flake.id, {
        width: px(flakeWidth.value),
        visibility: 'hidden',
      })
    }
  }

  return styles
})

const innerHeight = computed(() => props.usableSize.height - 2 * getDesign().pad.y)

// The Flake in edit is to be taken out of the original masonry.
const styleUnderEdit = computed<StyleValue>(() => {
  const id = flakeIdUnderEdit.value
  if (!id) return

  const design = getDesign()
  const rect = resolvedMasonry.value?.rects.get(id)

  // If cannot find originally computed rect,
  // this is a newly craeted Flake and is to be put at the top left.
  if (!rect) {
    return {
      translate: point(design.pad.x, props.scroll.y + design.pad.y),
      width: px(flakeWidth.value),
    }
  }

  const cachedHeight = heightUnderEdit.value || rect.height
  let availableHeight = innerHeight.value

  // As on mobile the usable height changes when the keyboard rises,
  // It's impossible to have a relative available height
  // and reserve space for the bottom menu at the same time.
  if (Platform.isMobile) {
    availableHeight = Math.min(availableHeight, 400)
  }

  const actualHeight = Math.min(cachedHeight, availableHeight)

  let y: number
  const spaceBelow = innerHeight.value + props.scroll.y - rect.y

  if (rect.y < props.scroll.y || actualHeight > innerHeight.value) {
    // 1. The top of the Flake in edit has scrolled out of the top of usable area;
    // 2. The inner height of the Flake is larger than usable height.
    y = props.scroll.y + design.pad.y
  } else if (actualHeight > spaceBelow) {
    // The inner height of the Flake is larger than distance
    // from the top-left point of the Flake to the bottom line of the usable area.
    y = props.scroll.y + design.pad.y + (innerHeight.value - actualHeight)
  } else {
    // Other situations.
    y = rect.y
  }

  return {
    translate: point(rect.x, y),
    width: px(rect.width),
    height: px(actualHeight),
  }
})

const styleMasonry = computed<StyleValue>(() => {
  const size = resolvedMasonry.value?.size
  if (!size) return

  return {
    width: px(Math.max(size.width, props.usableSize.width)),
    height: px(Math.max(size.height, props.usableSize.height)),
  }
})

/* Flake Management */

async function togglePinning(id: string, value: boolean) {
  plugin.updateFlakeMeta(id, 'pinned', value)
  resolveMasonry()

  if (value) {
    bus.emit('scroll-to', id)
    bus.emit('callout', { id })
  }
}

async function startEditing(id: string) {
  heightUnderEdit.value = 0
  flakeIdUnderEdit.value = id

  await nextTick()
  bus.emit('callout', { id })
}

function updateHeightUnderEdit(height: number) {
  heightUnderEdit.value = height
}

async function cancelEditing() {
  flakeIdUnderEdit.value = null
  heightUnderEdit.value = 0
  resolveMasonry()
}

async function finishEditing(id: string) {
  await cancelEditing()
  bus.emit('scroll-to', id)
  bus.emit('callout', { id })
}

function deleteFlake(id: string) {
  // Disable the ability to delete other flakes when editing a flake.
  // This is an extra guard, as it is already guarded in FlakeView.
  if (flakeIdUnderEdit.value) return

  plugin.deleteFlake(id)
  resolveMasonry()
}
</script>

<template>
  <div class="layout-masonry" :style="styleMasonry">
    <FlakeView
      v-for="flake of flakesUnderView"
      :key="flake.id"
      :style="stylesUnderView.get(flake.id)"
      :flake="flake"
      :flow="flow"
      :inner-height="innerHeight"
      :disable-delete="flakeIdUnderEdit != null"
      @pin="togglePinning"
      @edit="startEditing"
      @delete="deleteFlake"
    />

    <FlakeEdit
      v-if="flakeUnderEdit != null"
      :style="styleUnderEdit"
      :flake="flakeUnderEdit"
      :inner-height="innerHeight"
      @update-height="updateHeightUnderEdit"
      @finish="finishEditing"
      @cancel="cancelEditing"
    />
  </div>
</template>

<style scoped lang="scss">
.layout-masonry {
  position: relative;
}
</style>
