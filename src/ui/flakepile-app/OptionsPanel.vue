<script setup lang="ts">
import type { IsDevRef } from '@/App.vue'
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileAdaptiveFlow, FlakepileMeta } from '@/schemes/common'
import { useCssIf, useFlakepileMetaBinder } from '@/use'
import { ObSlider } from '@/wrappers'
import { inject } from 'vue'

const props = defineProps<{
  meta: FlakepileMeta
  flow: FlakepileAdaptiveFlow
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const isDev = inject('isDev') as IsDevRef

const bind = useFlakepileMetaBinder(plugin)
const metaWidth = bind(props.meta, 'width')
const metaElasticWidth = bind(props.meta, 'elasticWidth')
const metaEnableMaxHeight = bind(props.meta, 'enableMaxHeight')
const metaMaxHeight = bind(props.meta, 'maxHeight')
const metaElasticHeight = bind(props.meta, 'elasticHeight')
const metaShowLabels = bind(props.meta, 'showLabels')
const metaShowTimes = bind(props.meta, 'showTimes')
const metaDirectDelete = bind(props.meta, 'directDelete')

const ifMaxHeightDisabled = useCssIf(() => !metaEnableMaxHeight.value, '-disabled')
</script>

<template>
  <div class="menu options-panel">
    <div class="options-item">
      <span>Width</span>
      <ObSlider
        v-model="metaWidth"
        :default="280"
        :min="180"
        :max="600"
        :step="20"
        class="slider"
      />
    </div>

    <label v-if="flow === 'vertical'" class="options-item">
      <span>Elastic width</span>
      <input type="checkbox" v-model="metaElasticWidth" />
    </label>

    <hr />

    <label class="options-item">
      <span>Set maximum height</span>
      <input type="checkbox" v-model="metaEnableMaxHeight" />
    </label>

    <div :class="['options-item', ifMaxHeightDisabled]">
      <span class="label">Height</span>
      <ObSlider
        v-model="metaMaxHeight"
        :default="400"
        :min="120"
        :max="800"
        :step="40"
        :disabled="!metaEnableMaxHeight"
        class="slider"
      />
    </div>

    <label
      v-if="flow === 'horizontal'"
      :class="['options-item', ifMaxHeightDisabled]"
    >
      <span class="label">Elastic height</span>
      <input
        type="checkbox"
        v-model="metaElasticHeight"
        :disabled="!metaEnableMaxHeight"
      />
    </label>

    <hr />

    <label v-if="isDev" class="options-item">
      <span>Show Labels</span>
      <input type="checkbox" v-model="metaShowLabels" />
    </label>

    <label class="options-item">
      <span>Show times</span>
      <input type="checkbox" v-model="metaShowTimes" />
    </label>

    <label class="options-item">
      <span>Delete without confirmation</span>
      <input type="checkbox" v-model="metaDirectDelete" />
    </label>
  </div>
</template>

<style lang="scss" scoped>
.options-panel {
  display: grid;
  pointer-events: visible;

  padding: var(--size-4-2) var(--size-4-3);
  row-gap: var(--size-4-1);

  font-size: var(--font-ui-small);

  > :global(hr) {
    margin: var(--size-2-1) var(--size-4-1) var(--size-2-1) var(--size-2-1);
  }
}

.options-item {
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
