<script setup lang="ts">
import { computed, reactive, ref, watch, type CSSProperties } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import type { Flake } from '@/data'
import type { MasonryOptions, ResolveMasonryOptions, StyledMasonry } from './masonry-common'
import { resolveMasonryVertical } from './masonry-vertical'
import { resolveMasonryHorizontal } from './masonry-horizontal'
import FlakeView from './FlakeView.vue'

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
  const flakeIds = new Set(props.flakes.map((f) => f.id))

  for (const id of heightMap.keys()) {
    if (!flakeIds.has(id)) {
      heightMap.delete(id)
    }
  }

}

const masonryStyles = ref<CSSProperties>({})
const outerStyles = ref<Map<string, CSSProperties>>(new Map())
const innerStyles = ref<Map<string, CSSProperties>>(new Map())

const updateStyles = (styles: StyledMasonry) => {
  masonryStyles.value = styles.mansory
  outerStyles.value = styles.outer
  innerStyles.value = styles.inner
}

const resolveOptions = computed<ResolveMasonryOptions>(() => {
  return {
    ...props.options,
    editing: editing.value,
  }
})

const resolveMasonry = () => {
  if (props.flow == 'vertical') {
    const styles = resolveMasonryVertical(
      props.flakes,
      heightMap,
      resolveOptions.value,
    )
    updateStyles(styles)
  }
  if (props.flow == 'horizontal') {
    const styles = resolveMasonryHorizontal(
      props.flakes,
      heightMap,
      resolveOptions.value,
    )
    updateStyles(styles)
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

watch([
  () => props.flakes,
], () => {
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
  <div ref="el-masonry" class="mansory-unified" :style="masonryStyles">
    <FlakeView v-for="flake of flakes"
      :key="flake.id"
      class="mansory-element"
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
.mansory-unified {
  position: relative;
}

.mansory-element {
  position: absolute;
}
</style>
