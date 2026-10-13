<script setup lang="ts">
import { useCssIf } from '@/use'
import { exists } from '@rewl/kit'
import { SliderComponent } from 'obsidian'
import { onMounted, useTemplateRef, watch } from 'vue'
import ObIcon from './ObIcon.vue'

const props = withDefaults(
  defineProps<{
    default: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    instant?: boolean
    showTooltip?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    instant: true,
    showTooltip: true,
  },
)

const model = defineModel<number>()

const $anchor = useTemplateRef('$anchor')
let slider: SliderComponent | null = null

onMounted(async () => {
  model.value ??= props.default

  slider = new SliderComponent($anchor.value!)
    .setLimits(props.min, props.max, props.step)
    .setValue(model.value)
    .setDisabled(props.disabled)
    .setInstant(props.instant)
    .onChange((value) => {
      model.value = value
    })

  if (props.showTooltip) {
    slider.setDynamicTooltip()
  }
})

watch(() => model.value, (next) => {
  if (exists(next) && slider && slider.getValue() !== next) {
    slider.setValue(next)
  }
})

watch([
  () => props.min,
  () => props.max,
  () => props.step,
], ([nextMin, nextMax, nextStep]) => {
  slider?.setLimits(nextMin, nextMax, nextStep)
})

watch(() => props.instant, (next) => {
  slider?.setInstant(next)
})

watch(() => props.disabled, (next) => {
  slider?.setDisabled(next)
})

const reset = () => {
  model.value = props.default
}

const cssDisabled = useCssIf(() => props.disabled, '-disabled')
</script>

<template>
  <div class="ob-slider">
    <div :class="['clickable-icon', cssDisabled]" @click="reset">
      <ObIcon name="rotate-ccw" />
    </div>
    <div ref="$anchor" class="ob-slider-anchor"></div>
  </div>
</template>

<style scoped>
.clickable-icon {
  padding: var(--size-4-1);

  &.-disabled {
    visibility: hidden;
  }
}

.ob-slider {
  display: flex;
  align-items: center;
}

.ob-slider-anchor {
  display: flex;
  align-items: center;
  width: 100%;

  & :deep(.slider) {
    width: 100%;
  }
}
</style>
