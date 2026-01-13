<script setup lang="ts">
import { onMounted, watch, useTemplateRef } from 'vue'
import { SliderComponent } from 'obsidian'
import { exists } from '@rewl/kit'
import { useCssIf } from '@/utils'
import ObIcon from './ObIcon.vue'

const props = withDefaults(defineProps<{
  default: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  instant?: boolean
  showTooltip?: boolean
}>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  instant: true,
  showTooltip: true,
})

const model = defineModel<number>()

const sliderRef = useTemplateRef('el-slider')
let component: SliderComponent | null = null

onMounted(() => {
  model.value ??= props.default

  if (sliderRef.value) {
    component = new SliderComponent(sliderRef.value)
      .setLimits(props.min, props.max, props.step)
      .setValue(model.value)
      .setDisabled(props.disabled)
      .setInstant(props.instant)
      .onChange((value) => {
        model.value = value
      })

    if (props.showTooltip) {
      component.setDynamicTooltip()
    }
  }
})

watch(() => model.value, (next) => {
  if (exists(next) && component && component.getValue() !== next) {
    component.setValue(next)
  }
})

watch([
  () => props.min,
  () => props.max,
  () => props.step,
], ([nextMin, nextMax, nextStep]) => {
  component?.setLimits(nextMin, nextMax, nextStep)
})

watch(() => props.instant, (next) => {
  component?.setInstant(next)
})

watch(() => props.disabled, (next) => {
  component?.setDisabled(next)
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
    <div ref="el-slider" class="ob-slider-wrapper"></div>
  </div>
</template>

<style lang="scss" scoped>
.clickable-icon {
  padding: var(--size-4-2);

  &.-disabled {
    visibility: hidden;
  }
}

.ob-slider {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);
}

.ob-slider-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>

<style>
.ob-slider-wrapper>.slider {
  width: 100%;
}
</style>
