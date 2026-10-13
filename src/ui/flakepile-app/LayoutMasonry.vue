<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake, FlakepileAdaptiveFlow } from '@/schemes/v1'
import type { FlakeIdEditingRef, FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { type ComputedMasonry, computeInitialWidth, computeMasonry, design } from '@/ui/masonry/entry'
import { type Point, point, px, type Size } from '@/utils'
import { useThrottleFn } from '@vueuse/core'
import { computed, inject, nextTick, ref, shallowRef, type StyleValue, watch } from 'vue'
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
const flakeIdEditing = inject('flakeIdEditing') as FlakeIdEditingRef
const meta = inject('meta') as FlakepileMetaRef

const flakesViewing = computed<Flake[]>(() => {
  return props.flakes.filter((flake) => flake.id !== flakeIdEditing.value)
})

const flakeEditing = computed<Flake | null>(() => {
  const found = props.flakes.find((flake) => flake.id === flakeIdEditing.value)
  return typeof found !== 'undefined' ? found : null
})

// Collect dependency of all size cache.
const sizeCacheSignal = computed<number[]>(() => {
  return props.flakes.flatMap((flake) => [flake.cache.width, flake.cache.height])
})

const resolvedMasonry = shallowRef<ComputedMasonry>()
const editingHeight = ref(0)

function resolveMasonry() {
  // Do not reflow when some Flake is being edit.
  if (flakeIdEditing.value != null) return

  resolvedMasonry.value = computeMasonry(
    props.flow,
    props.flakes,
    meta.value,
    props.usableSize,
  )
}

// The purpose of throttling is to run only 1 time
// when everyone is calling the function at the same time.
const resolveMasonryThrottled = useThrottleFn(resolveMasonry, 10, true)

watch(
  [
    sizeCacheSignal,
    () => props.id,
    () => props.flow,
    () => props.usableSize.width,
    () => props.usableSize.height,
    () => meta.value.width,
    () => meta.value.elasticWidth,
    () => meta.value.enableMaxHeight,
    () => meta.value.maxHeight,
    () => meta.value.elasticHeight,
    () => meta.value.showTimes,
  ],
  resolveMasonryThrottled,
  { immediate: true },
)

const initialWidth = computed(() => {
  return computeInitialWidth(props.flow, meta.value, props.usableSize)
})

const stylesViewing = computed<Map<string, StyleValue>>(() => {
  const styles = new Map<string, StyleValue>()
  const rects = resolvedMasonry.value?.rects

  for (const flake of flakesViewing.value) {
    const rect = rects?.get(flake.id)

    if (rect) {
      styles.set(flake.id, {
        translate: point(rect.x, rect.y),
        width: px(rect.width),
        height: px(rect.height),
      })
    } else {
      styles.set(flake.id, {
        width: px(initialWidth.value),
        visibility: 'hidden',
      })
    }
  }

  return styles
})

const innerHeight = computed(() => props.usableSize.height - 2 * design.pad.y)

// The Flake in edit is to be taken out of the original masonry.
const styleEditing = computed<StyleValue>(() => {
  const id = flakeIdEditing.value
  if (!id) return

  const rect = resolvedMasonry.value?.rects.get(id)
  if (!rect) return

  const cachedHeight = editingHeight.value || rect.height
  const actualHeight = Math.min(cachedHeight, innerHeight.value)

  let y: number
  const spaceBelow = innerHeight.value - rect.y

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

function startEditing(id: string) {
  editingHeight.value = 0
  flakeIdEditing.value = id
}

function updateEditingHeight(height: number) {
  editingHeight.value = height
}

function deleteFlake(id: string) {
  // Disable the ability to delete other flakes when editing a flake.
  // This is an extra guard, as it is already guarded in FlakeView.
  if (flakeIdEditing.value) return

  plugin.deleteFlake(id)
  resolveMasonry()
}

async function finishEditing(_id: string) {
  flakeIdEditing.value = null
  editingHeight.value = 0

  await nextTick()
  resolveMasonry()
}
</script>

<template>
  <div class="layout-masonry" :style="styleMasonry">
    <FlakeView
      v-for="flake of flakesViewing"
      :key="flake.id"
      class="masonry-element"
      :style="stylesViewing.get(flake.id)"
      :flake="flake"
      :inner-height="innerHeight"
      :disable-delete="flakeIdEditing != null"
      @edit="startEditing"
      @delete="deleteFlake"
    />

    <FlakeEdit
      v-if="flakeEditing"
      class="masonry-element"
      :style="styleEditing"
      :flake="flakeEditing"
      :inner-height="innerHeight"
      @update-height="updateEditingHeight"
      @finish="finishEditing"
    />
  </div>
</template>

<style scoped lang="scss">
.layout-masonry {
  position: relative;
}

.masonry-element {
  position: absolute;
}
</style>
