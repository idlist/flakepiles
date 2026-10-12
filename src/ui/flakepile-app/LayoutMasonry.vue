<script setup lang="ts">
import type { FlakepilePlugin } from '@/custom-view'
import type { Flake, FlakepileAdaptiveFlow, FlakepileMeta } from '@/schemes/v1'
import type { FlakeIdEditing } from '@/ui/FlakepileApp.vue'
import { type ComputedMasonry, computeInitialWidth, computeMasonry, design } from '@/ui/masonry/entry'
import { type Point, point, px, type Size } from '@/utils'
import { useThrottleFn } from '@vueuse/core'
import { computed, inject, nextTick, shallowRef, type StyleValue, watch } from 'vue'
import FlakeEdit from './FlakeEdit.vue'
import FlakeView from './FlakeView.vue'

const props = defineProps<{
  id: string
  flow: FlakepileAdaptiveFlow
  meta: FlakepileMeta
  usableSize: Size
  scroll: Point
  flakes: Flake[]
}>()

const plugin = inject('plugin') as FlakepilePlugin
const flakeIdEditing = inject('flakeIdEditing') as FlakeIdEditing

const flakesViewing = computed<Flake[]>(() => {
  return props.flakes.filter((flake) => flake.id !== flakeIdEditing.value)
})

const flakeEditing = computed<Flake | null>(() => {
  const found = props.flakes.find((flake) => flake.id === flakeIdEditing.value)
  return typeof found !== 'undefined' ? found : null
})

const sizeCache = computed<number[]>(() => {
  return props.flakes.flatMap((flake) => [flake.cache.width, flake.cache.height])
})

const resolvedMasonry = shallowRef<ComputedMasonry>()

function resolveMasonry() {
  resolvedMasonry.value = computeMasonry(
    props.flow,
    props.flakes,
    props.meta,
    props.usableSize,
  )
}

const resolveMasonryThrottled = useThrottleFn(resolveMasonry, 100, true)

watch(
  [
    sizeCache,
    () => props.id,
    () => props.flow,
    () => props.meta.width,
    () => props.meta.elasticWidth,
    () => props.meta.enableMaxHeight,
    () => props.meta.maxHeight,
    () => props.meta.elasticHeight,
    () => props.usableSize.width,
    () => props.usableSize.height,
  ],
  resolveMasonryThrottled,
  { immediate: true },
)

const initialWidth = computed(() => {
  return computeInitialWidth(props.flow, props.meta, props.usableSize)
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

const styleEditing = computed<StyleValue>(() => {
  const id = flakeIdEditing.value
  if (!id) return

  const rect = resolvedMasonry.value?.rects.get(id)
  if (!rect) return

  const innerHeight = props.usableSize.height - 2 * design.pad.y
  const cachedHeight = flakeEditing.value?.cache.height || rect.height
  const actualHeight = Math.min(cachedHeight, innerHeight)

  let y: number
  const spaceBelow = innerHeight - (rect.y - props.scroll.y)

  if (rect.y < props.scroll.y || actualHeight > innerHeight) {
    y = props.scroll.y + design.pad.y
  } else if (actualHeight > spaceBelow) {
    y = props.scroll.y + design.pad.y + (innerHeight - actualHeight)
  } else {
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
  flakeIdEditing.value = id
}

function deleteFlake(id: string) {
  plugin.deleteFlake(id)
  resolveMasonry()
}

async function finishEditing(_id: string) {
  flakeIdEditing.value = null
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
      :flake="flake"
      :style="stylesViewing.get(flake.id)"
      @edit="startEditing"
      @delete="deleteFlake"
    />

    <FlakeEdit
      v-if="flakeEditing"
      class="masonry-element"
      :flake="flakeEditing"
      :style="styleEditing"
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
