<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakeLabel } from '@/schemes/common'
import { useCssIf, useFlakeLabelPropsBinder } from '@/use'
import { ObIcon } from '@/wrappers'
import { inject } from 'vue'
import LabelsBadge from './LabelsBadge.vue'

const props = defineProps<{
  label: FlakeLabel
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const bind = useFlakeLabelPropsBinder(plugin)

const filteredOut = bind(props.label, 'filteredOut')
const collapsed = bind(props.label, 'collapsed')

const ifFilteredOut = useCssIf(filteredOut, 'fp-invert')
const ifCollapsed = useCssIf(collapsed, 'fp-invert')
</script>

<template>
  <div class="fp-labels-item">
    <button
      :class="['fp-btn-icon', ifFilteredOut]"
      @click="filteredOut = !filteredOut"
    >
      <ObIcon :name="filteredOut ? 'eye-closed' : 'eye'" />
    </button>

    <LabelsBadge :name="label.name" :color="label.color" />

    <div class="expand"></div>

    <button
      :class="['fp-btn-icon', ifCollapsed]"
      @click="collapsed = !collapsed"
    >
      <ObIcon :name="collapsed ? 'list-plus' : 'circle-off'" />
    </button>
  </div>
</template>
