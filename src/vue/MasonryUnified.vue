<script setup lang="ts">
import { computed, onBeforeUpdate, reactive, ref, shallowRef, watch, type CSSProperties, type WatchHandle } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import type { Flake } from '@/data'
import type { MasonryOptions, ResolveMasonryOptions, StyledMasonry } from './masonry-common'
import { resolveMasonryVertical } from './masonry-vertical'
import { resolveMasonryHorizontal } from './masonry-horizontal'
import { resolveMasonryMobile } from './masonry-mobile'
import FlakeView from './FlakeView.vue'
import { delay } from '@rewl/kit'

const props = defineProps<{
  id: string
  flakes: Flake[]
  flow: 'vertical' | 'horizontal' | 'mobile'
  options: MasonryOptions
}>()

const flakeIds = computed(() => new Set(props.flakes.map((f) => f.id)))

const editing = ref<string | null>(null)

const onEditBegin = (id: string) => {
  editing.value = id
}

const onEditFinish = () => {
  editing.value = null
}

const heightMap = reactive<Map<string, number>>(new Map())

const onHeightUpdate = (id: string, height: number) => {
  if (editing.value == id) return
  heightMap.set(id, height)
}

const validateHeightMap = () => {
  for (const id of heightMap.keys()) {
    if (!flakeIds.value.has(id)) {
      heightMap.delete(id)
    }
  }
}

type FlakeInstance = InstanceType<typeof FlakeView> | null

const refsFlake = ref<Record<string, FlakeInstance>>({})

onBeforeUpdate(() => {
  refsFlake.value = {}
})

const requestHighlight = async (id: string) => {
  watch(() => refsFlake.value[id], (elFlake) => {
    elFlake?.highlight()
  }, { once: true })
}

const scrollTo = (id: string) => {
  watch(() => refsFlake.value[id], async (elFlake) => {
    await delay(100)
    elFlake?.$el.scrollIntoView()
  }, { once: true })
}

const requestScrollTo = (id: string) => {
  scrollTo(id)
}

const masonryStyles = shallowRef<CSSProperties>({})
const outerStyles = shallowRef<Map<string, CSSProperties>>(new Map())
const innerStyles = shallowRef<Map<string, CSSProperties>>(new Map())

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
  else if (props.flow == 'horizontal') {
    const styles = resolveMasonryHorizontal(
      props.flakes,
      heightMap,
      resolveOptions.value,
    )
    updateStyles(styles)
  }
  else if (props.flow == 'mobile') {
    const styles = resolveMasonryMobile(
      props.flakes,
      heightMap,
      resolveOptions.value,
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
  heightMap,
  resolveOptions,
], () => {
  requestResolveMasonry()
}, { immediate: true })

defineExpose({
  requestHighlight,
  requestScrollTo,
})
</script>

<template>
  <div class="masonry-unified" :style="masonryStyles">
    <FlakeView v-for="flake of flakes"
      :key="flake.id"
      :ref="(el) => { refsFlake[flake.id] = el as FlakeInstance }"
      class="masonry-element"
      :class="{ '-preparing': !heightMap.has(flake.id) }"
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
