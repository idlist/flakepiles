<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileAdaptiveFlow, FlakepileMeta } from '@/schemes/v1'
import { useCssIf, useFlakepileMetaBinder } from '@/use'
import { ObSlider } from '@/wrappers'
import { inject } from 'vue'

const props = defineProps<{
  meta: FlakepileMeta
  flow: FlakepileAdaptiveFlow
}>()

const plugin = inject('plugin') as FlakepilePluginRef

const bind = useFlakepileMetaBinder(plugin)
const metaWidth = bind(props.meta, 'width')
const metaElasticWidth = bind(props.meta, 'elasticWidth')
const metaEnableMaxHeight = bind(props.meta, 'enableMaxHeight')
const metaMaxHeight = bind(props.meta, 'maxHeight')
const metaElasticHeight = bind(props.meta, 'elasticHeight')
const metaShowTimes = bind(props.meta, 'showTimes')
const metaDirectDelete = bind(props.meta, 'directDelete')

const useMaxHeightDisabled = useCssIf(() => !metaEnableMaxHeight.value, '-disabled')
</script>

<template>
  <div class="menu panel-options">
    <div class="option-item">
      <span>Width</span>
      <ObSlider
        v-model="metaWidth"
        :default="240"
        :min="120"
        :max="600"
        :step="20"
        class="slider"
      />
    </div>

    <label v-if="flow === 'vertical'" class="option-item">
      <span>Elastic width</span>
      <input v-model="metaElasticWidth" type="checkbox" />
    </label>

    <hr />

    <label class="option-item">
      <span>Set maximum height</span>
      <input v-model="metaEnableMaxHeight" type="checkbox" />
    </label>

    <div :class="['option-item', useMaxHeightDisabled]">
      <span class="label">Height</span>
      <ObSlider
        v-model="metaMaxHeight"
        :default="400"
        :min="120"
        :max="800"
        :step="20"
        :disabled="!metaEnableMaxHeight"
        class="slider"
      />
    </div>

    <label
      v-if="flow === 'horizontal'"
      :class="['option-item', useMaxHeightDisabled]"
    >
      <span class="label">Elastic height</span>
      <input
        v-model="metaElasticHeight"
        type="checkbox"
        :disabled="!metaEnableMaxHeight"
      />
    </label>

    <hr />

    <label class="option-item">
      <span>Show times</span>
      <input v-model="metaShowTimes" type="checkbox" />
    </label>

    <label class="option-item">
      <span>Delete without confirmation</span>
      <input v-model="metaDirectDelete" type="checkbox" />
    </label>
  </div>
</template>

<style lang="scss" scoped>
.panel-options {
  display: grid;
  pointer-events: visible;

  padding: var(--size-4-2) var(--size-4-3);
  row-gap: var(--size-4-1);

  font-size: var(--font-ui-small);

  > :global(hr) {
    margin: var(--size-2-1) var(--size-4-1) var(--size-2-1) var(--size-2-1);
  }
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: var(--size-4-4);
  min-height: 24px;

  > .slider {
    width: auto;
  }

  > input[type="checkbox"] {
    margin-right: var(--size-2-1);
  }

  > input[type="checkbox"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.-disabled > .label {
    color: var(--text-faint);
  }
}
</style>
