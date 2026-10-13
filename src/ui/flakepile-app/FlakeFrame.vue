<script setup lang="ts">
import { bus } from '@/ui/logic/event-bus'
import { useListener } from '@/use'
import { until, type UntilToMatchOptions } from '@vueuse/core'
import { inject, useTemplateRef } from 'vue'
import type { IsLayoutStableRef } from './LayoutMasonry.vue'

const props = defineProps<{
  id?: string
}>()

const isLayoutStable = inject('isLayoutStable') as IsLayoutStableRef
const $flake = useTemplateRef('$flake')
const listen = useListener(bus)

listen('scroll-to', (id) => {
  if (typeof props.id === 'undefined') return
  if (props.id !== id) return
  scrollIntoView()
})

const timeout: UntilToMatchOptions = {
  timeout: 1000,
}

async function scrollIntoView() {
  await until(isLayoutStable).toBe(true, timeout)
  $flake.value?.scrollIntoView()
}
</script>

<template>
  <div ref="$flake" :class="['fp-flake-frame', '-none']">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.fp-flake-frame {
  position: absolute;
  overflow: hidden;
}
</style>
