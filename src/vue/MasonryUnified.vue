<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch, type StyleValue } from 'vue'
import { until, useThrottleFn } from '@vueuse/core'
import type { Flake } from '@/data'
import { px, pxy, type MasonryOptions, type ResolvedMasonry, type ResolvedRect, type ResolvedSize } from './masonry-common'
import { resolveMasonryVertical } from './masonry-vertical'
import { resolveMasonryHorizontal } from './masonry-horizontal'
import { resolveMasonryMobile } from './masonry-mobile'
import FlakeView from './FlakeView.vue'

const props = defineProps<{
  id: string
  flakes: Flake[]
  flow: 'vertical' | 'horizontal' | 'mobile'
  options: MasonryOptions
}>()

const flakeIds = computed(() => new Set(props.flakes.map((f) => f.id)))

const editing = ref<string | null>(null)
let editingHeightCache: number = 0

const onEditBegin = (id: string) => {
  editing.value = id
  editingHeightCache = 0
}

const onEditFinish = () => {
  editing.value = null
}

const heightMap = reactive<Map<string, number>>(new Map())

const onHeightUpdate = (id: string, height: number) => {
  if (editing.value == id) {
    editingHeightCache = height
  }
  else {
    heightMap.set(id, height)
  }
}

watch(editing, (_, prev) => {
  if (!prev) return
  if (!editingHeightCache) return
  heightMap.set(prev, editingHeightCache)
})

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
    flakeRefs.value.get(id)!.highlight()
  } catch (e) {
    console.warn('Failed to show highlight:', e)
  }
}

const requestScrollTo = async (id: string) => {
  try {
    await until(() => flakeRefs.value.has(id) && resolvedFlakes.value.has(id))
      .toBe(true, requestTimeout)
    flakeRefs.value.get(id)!.scrollIntoView()
  } catch (e) {
    console.warn('Failed to scroll into view:', e)
  }
}

const resolvedFlakes = shallowRef<Set<string>>(new Set())
const resolvedRect = shallowRef<Map<string, ResolvedRect>>(new Map())
const resolvedMasonry = shallowRef<ResolvedSize>()

const updateStyles = (resolved: ResolvedMasonry) => {
  resolvedFlakes.value = resolved.flakes
  resolvedRect.value = resolved.rect
  resolvedMasonry.value = resolved.masonry
}

const outerStyle = (id: string): StyleValue => {
  const rect = resolvedRect.value.get(id)
  if (!rect) return

  return {
    translate: pxy(rect.x, rect.y),
    width: px(rect.width),
  }
}

const innerStyle = (id: string): StyleValue => {
  const rect = resolvedRect.value.get(id)
  if (!rect) return

  return {
    height: px(rect.height),
  }
}

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

const throttleResolveMasonry = useThrottleFn(resolveMasonry, 100, true)

const requestResolveMasonry = () => {
  if (heightMap.size != props.flakes.length) return

  throttleResolveMasonry()
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
  requestResolveMasonry()
}, { immediate: true })

defineExpose({
  requestHighlight,
  requestScrollTo,
})
</script>

<template>
  <div class="masonry-unified" :style="masonryStyle">
    <FlakeView v-for="flake of flakes"
      :key="flake.id"
      :ref="(el) => { setFlakeRef(flake.id, el as MaybeFlakeRef) }"
      class="masonry-element"
      :class="{ '-preparing': !resolvedFlakes.has(flake.id) }"
      :flake="flake"
      :editing="editing == flake.id"
      :style="outerStyle(flake.id)"
      :inner-style="innerStyle(flake.id)"
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
