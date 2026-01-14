<script setup lang="ts">
import type { PileAdaptiveFlow } from '@/data'
import { ObSlider } from '@/components'

defineProps<{
  flow: PileAdaptiveFlow
}>()

const width = defineModel<number>('width')
const elasticWidth = defineModel<boolean>('elastic-width')
const enableMaxHeight = defineModel<boolean>('enable-max-height')
const maxHeight = defineModel<number>('max-height')
const elasticHeight = defineModel<boolean>('elastic-height')
</script>

<template>
  <div class="fp-obsidian-panel size-options-panel">
    <div class="size-option">
      <span>Width</span>
      <ObSlider v-model="width"
        :default="1"
        :min="0.5"
        :max="2"
        :step="0.05"
        class="slider" />
    </div>

    <label v-if="flow == 'vertical'" class="size-option">
      <span>Elastic width</span>
      <input v-model="elasticWidth" type="checkbox" />
    </label>

    <hr />

    <label class="size-option">
      <span>Set maximum height</span>
      <input v-model="enableMaxHeight" type="checkbox" />
    </label>

    <div :class="['size-option', enableMaxHeight ? '' : '-disabled']">
      <span class="label">Height</span>
      <ObSlider v-model="maxHeight"
        :default="1"
        :min="0.4"
        :max="2.5"
        :step="0.05"
        :disabled="!enableMaxHeight"
        class="slider" />
    </div>

    <label v-if="flow == 'horizontal'"
      :class="['size-option', enableMaxHeight ? '' : '-disabled']">
      <span class="label">Elastic height</span>
      <input v-model="elasticHeight"
        type="checkbox"
        :disabled="!enableMaxHeight" />
    </label>
  </div>
</template>

<style lang="scss" scoped>
.size-options-panel {
  display: grid;
  row-gap: var(--size-4-1);
}

.size-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: var(--size-4-4);
  min-height: 24px;

  & .slider {
    width: auto;
    min-width: 120px;
  }

  & input[type=checkbox] {
    margin-right: var(--size-2-1);
  }

  & input[type=checkbox]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.-disabled>.label {
    color: var(--text-faint);
  }
}
</style>

<style>
.size-options-panel>hr {
  margin: var(--size-4-1) 0;
  margin-right: var(--size-2-1);
}
</style>
