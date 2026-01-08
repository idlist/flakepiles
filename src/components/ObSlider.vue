<script setup lang="ts">
import { onMounted, watch, useTemplateRef } from 'vue'
import { SliderComponent } from 'obsidian'

const props = withDefaults(defineProps<{
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

const model = defineModel<number>({ default: 0 })

const refSlider = useTemplateRef('el-slider')
let component: SliderComponent | null = null

onMounted(() => {
  if (refSlider.value) {
    component = new SliderComponent(refSlider.value)
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
  if (component && component.getValue() !== next) {
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
</script>

<template>
  <div ref="el-slider" class="ob-wrapper"></div>
</template>

<style scoped>
.ob-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.ob-wrapper :deep(.slider) {
  width: 100%;
}
</style>
