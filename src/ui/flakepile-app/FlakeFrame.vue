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

/* Scroll Into View */

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
  $flake.value!.scrollIntoView({ block: 'nearest' })
}

/* Callout */

listen('callout', (payload) => {
  if (typeof props.id === 'undefined') return
  if (props.id !== payload.id) return
  callout(payload.duration)
})

let calloutAnimation: Animation | null = null

async function callout(duration: number = 500) {
  await until($flake).not.toBeNull(timeout)

  calloutAnimation?.cancel()
  calloutAnimation = $flake.value?.animate(
    [
      { boxShadow: 'var(--shadow-heavy)' },
      { boxShadow: 'var(--shadow-normal)' },
    ],
    { duration: duration, easing: 'ease-in' },
  ) ?? null
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

  scroll-margin: var(--size-4-2);
}
</style>
