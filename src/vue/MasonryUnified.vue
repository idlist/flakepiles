<script setup lang="ts">
import { computed, inject, reactive, ref, shallowRef, useTemplateRef, watch, type StyleValue } from 'vue'
import { until, useThrottleFn } from '@vueuse/core'
import type { EditingRef, Flake, PileAdaptiveFlow } from '@/data'
import { PAD_Y, type MasonryOptions, type ResolvedMasonry, type ResolvedRect, type ResolvedMasonrySize, getUnsetWidth } from './masonry-common'
import { resolveMasonryVertical } from './masonry-vertical'
import { resolveMasonryHorizontal } from './masonry-horizontal'
import { resolveMasonryMobile } from './masonry-mobile'
import FlakeView from './FlakeView.vue'
import { pxpair, px } from '@/utils'

const props = withDefaults(defineProps<{
  id: string
  flakes: Flake[]
  flow: PileAdaptiveFlow
  scrollX?: number
  scrollY?: number
  options: MasonryOptions
}>(), {
  scrollX: 0,
  scrollY: 0,
})

const masonryRef = useTemplateRef('el-masonry')
const flakeIds = computed(() => new Set(props.flakes.map((f) => f.id)))

const editing = inject('editing') as EditingRef
const editingHeightCache = ref<number>(0)

const onEditBegin = (id: string) => {
  editing.value = id
  editingHeightCache.value = 0
}

const onEditFinish = () => {
  editing.value = null
}

const heightMap = reactive<Map<string, number>>(new Map())

const onHeightUpdate = (id: string, height: number) => {
  if (editing.value == id) {
    editingHeightCache.value = height
  }
  else {
    heightMap.set(id, height)
  }
}

const validateHeightMap = () => {
  for (const id of heightMap.keys()) {
    if (!flakeIds.value.has(id)) {
      heightMap.delete(id)
    }
  }
}

type MaybeFlakeRef = InstanceType<typeof FlakeView> | null

const flakeRefs = ref<Map<string, MaybeFlakeRef>>(new Map())

const setFlakeRef = (id: string, el: MaybeFlakeRef) => {
  if (el) {
    flakeRefs.value.set(id, el)
  } else {
    flakeRefs.value.delete(id)
  }
}

const requestTimeout = { timeout: 1000, throwOnTimeout: true }

const requestHighlight = async (id: string) => {
  try {
    await until(() => flakeRefs.value.has(id))
      .toBe(true, requestTimeout)
    flakeRefs.value.get(id)!.highlight('long')
  } catch (e) {
    console.warn('Failed to show highlight:', e)
  }
}

const requestScrollTo = async (id: string) => {
  try {
    await until(() => flakeRefs.value.has(id) && resolvedFlakes.value.has(id))
      .toBe(true, requestTimeout)
    flakeRefs.value.get(id)!.root!.scrollIntoView({
      behavior: 'instant',
      block: 'nearest',
      inline: 'nearest',
    })
  } catch (e) {
    console.warn('Failed to scroll into view:', e)
  }
}

const resolvedFlakes = shallowRef<Set<string>>(new Set())
const resolvedRects = shallowRef<Map<string, ResolvedRect>>(new Map())
const resolvedMasonry = shallowRef<ResolvedMasonrySize>()

const updateStyles = (resolved: ResolvedMasonry) => {
  resolvedFlakes.value = resolved.flakes
  resolvedRects.value = resolved.rects
  resolvedMasonry.value = resolved.masonry
}

const flakeStyles = computed<Map<string, StyleValue>>(() => {
  const styles = new Map<string, StyleValue>()
  const unsetWidth = getUnsetWidth(props.flow, props.options)

  for (const flake of props.flakes) {
    const rect = resolvedRects.value.get(flake.id)

    if (rect) {
      styles.set(flake.id, {
        translate: pxpair(rect.x, rect.y),
        width: px(rect.width),
        height: px(rect.height),
      })
    }
    else {
      styles.set(flake.id, {
        width: px(unsetWidth),
      })
    }
  }

  return styles
})

const editingStyles = computed<StyleValue>(() => {
  const rect = resolvedRects.value.get(editing.value!)!

  let cachedHeight = editingHeightCache.value
  if (!cachedHeight) {
    cachedHeight = rect.height
  }

  const contentHeight = props.options.canvasHeight - PAD_Y * 2

  let actualHeight = cachedHeight
  actualHeight = Math.min(actualHeight, contentHeight)

  let y: number
  const spaceBelow = contentHeight - (rect.y - props.scrollY)

  if (rect.y < props.scrollY || actualHeight > contentHeight) {
    y = props.scrollY + PAD_Y
  }
  else if (actualHeight > spaceBelow) {
    y = props.scrollY + PAD_Y + (contentHeight - actualHeight)
  }
  else {
    y = rect.y
  }

  return {
    translate: pxpair(rect.x, y),
    width: px(rect.width),
    height: px(actualHeight),
  }
})

const masonryStyle = computed<StyleValue>(() => {
  const size = resolvedMasonry.value
  if (!size) return

  return {
    width: px(size.width),
    height: px(size.height),
  }
})

const resolveMasonry = () => {
  if (props.flow == 'vertical') {
    const styles = resolveMasonryVertical(
      props.flakes,
      heightMap,
      props.options,
    )
    updateStyles(styles)
  }
  else if (props.flow == 'horizontal') {
    const styles = resolveMasonryHorizontal(
      props.flakes,
      heightMap,
      props.options,
    )
    updateStyles(styles)
  }
  else if (props.flow == 'mobile') {
    const styles = resolveMasonryMobile(
      props.flakes,
      heightMap,
      props.options,
    )
    updateStyles(styles)
  }
}

const resolveMasonryThrottled = useThrottleFn(resolveMasonry, 100, true)

const autoResolveMasonry = () => {
  if (heightMap.size != props.flakes.length) return
  if (editing.value) return

  resolveMasonryThrottled()
}

watch(() => props.id, () => {
  heightMap.clear()
})

watch([
  () => props.flakes,
], () => {
  validateHeightMap()
})

watch([
  () => props.flakes,
  () => props.flow,
  () => props.options,
  heightMap,
], () => {
  autoResolveMasonry()
}, { immediate: true })

defineExpose({
  root: masonryRef,
  requestHighlight,
  requestScrollTo,
})
</script>

<template>
  <div ref="el-masonry" class="masonry-unified" :style="masonryStyle">
    <FlakeView v-for="flake of flakes"
      :key="flake.id"
      :ref="(el) => { setFlakeRef(flake.id, el as MaybeFlakeRef) }"
      class="masonry-element"
      :class="{ '-preparing': !resolvedFlakes.has(flake.id) }"
      :flake="flake"
      :editing="editing == flake.id"
      :style="editing == flake.id ? editingStyles : flakeStyles.get(flake.id)"
      @edit-begin="onEditBegin"
      @edit-finish="onEditFinish"
      @height-update="onHeightUpdate" />
  </div>
</template>

<style lang="scss" scoped>
.masonry-unified {
  position: relative;
}

.masonry-element {
  position: absolute;

  &.-preparing {
    visibility: hidden;
  }
}
</style>
