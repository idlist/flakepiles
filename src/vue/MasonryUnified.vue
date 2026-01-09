<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef, watch, type CSSProperties } from 'vue'
import type { Flake, MasonryOptions, ResolveMasonryOptions, StyledMasonry } from '@/data'
import FlakeView from './FlakeView.vue'
import { resolveVerticalMasonry } from './masonry-vertical'
import { useElementSize, useThrottleFn } from '@vueuse/core'

const props = defineProps<{
  id: string
  flakes: Flake[]
  flow: 'vertical' | 'horizontal' | 'mobile'
  options: MasonryOptions
}>()

const editing = ref<string | null>(null)

const onEditBegin = (id: string) => {
  editing.value = id
}

const onEditFinish = () => {
  editing.value = null
}

const heightMap = reactive<Map<string, number>>(new Map())

const onHeightUpdate = (id: string, height: number) => {
  heightMap.set(id, height)
}

const validateHeightMap = () => {
  const ids = new Set(props.flakes.map((f) => f.id))

  for (const id of heightMap.keys()) {
    if (!ids.has(id)) {
      ids.delete(id)
    }
  }
}

const refMasonry = useTemplateRef('el-masonry')
const masonrySize = useElementSize(refMasonry)

const outerStyles = ref<Map<string, CSSProperties>>(new Map())
const innerStyles = ref<Map<string, CSSProperties>>(new Map())

const applyStyles = (styles: StyledMasonry) => {
  outerStyles.value = styles.outer
  innerStyles.value = styles.inner
}

const resolveOptions = computed<ResolveMasonryOptions>(() => {
  return {
    ...props.options,
    masonryWidth: masonrySize.width.value,
    masonryHeight: masonrySize.height.value,
    editing: editing.value,
  }
})

const resolveMasonry = () => {
  if (props.flow == 'vertical') {
    const styles = resolveVerticalMasonry(props.flakes, heightMap, resolveOptions.value)
    applyStyles(styles)
  }
}

const throttleResolveMasonry = useThrottleFn(resolveMasonry, 50, true)

const requestResolveMasonry = () => {
  if (heightMap.size != props.flakes.length) return
  if (editing.value) return

  throttleResolveMasonry()
}

watch(() => props.id, () => {
  heightMap.clear()
})

watch(() => props.flakes, () => {
  validateHeightMap()
})

watch([
  () => props.flakes,
  () => props.flow,
  heightMap,
  resolveOptions,
], () => {
  requestResolveMasonry()
}, { immediate: true })
</script>

<template>
  <div ref="el-masonry" class="unified-masonry">
    <FlakeView v-for="flake of flakes"
      :key="flake.id"
      class="unified-element"
      :flake="flake"
      :editing="editing == flake.id"
      :style="outerStyles.get(flake.id)"
      :inner-style="innerStyles.get(flake.id)"
      @edit-begin="onEditBegin"
      @edit-finish="onEditFinish"
      @height-update="onHeightUpdate" />
  </div>
</template>

<style lang="scss" scoped>
.unified-masonry {
  position: relative;
}

.unified-element {
  position: absolute;
}
</style>
