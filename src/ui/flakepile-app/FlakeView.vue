<script setup lang="ts">
import type { IsDev } from '@/App.vue'
import type { FlakepilePlugin } from '@/custom-view'
import type { Flake } from '@/schemes/v1'
import { ObIcon } from '@/wrappers'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { inject, nextTick, onMounted, useTemplateRef } from 'vue'
import FlakeFrame from './FlakeFrame.vue'

const props = defineProps<{
  flake: Flake
}>()

const emit = defineEmits<{
  pin: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()

const plugin = inject('plugin') as FlakepilePlugin
const isDev = inject('isDev') as IsDev

const $flake = useTemplateRef('$flake')
const $anchor = useTemplateRef('$anchor')

function updateSizeCache() {
  if (!$flake.value) return

  const $el = $flake.value.$el as HTMLDivElement
  plugin.updateFlakeSizeCache(
    props.flake.id,
    $el.offsetWidth,
    $el.offsetHeight,
  )
}

const updateSizeCacheDebounced = useDebounceFn(updateSizeCache, 50)

useResizeObserver($flake, (entries) => {
  const entry = entries[0]
  if (!entry) return

  const height = Math.round(entry.borderBoxSize[0]?.blockSize ?? 0)
  if (Math.abs(height - props.flake.cache.height) < 2) return

  updateSizeCacheDebounced()
})

function initializeSizeCache() {
  if (props.flake.cache.width !== 0 && props.flake.cache.height !== 0) return
  updateSizeCache()
}

onMounted(async () => {
  await plugin.renderContent($anchor.value!, props.flake.content)
  await nextTick()
  initializeSizeCache()
})

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.flake.content)
    plugin.notice('Content copied.', 1000)
  } catch (e) {
    console.warn(`Failed to copy the content of Flake ${props.flake.id}: `, e)
    plugin.notice('Failed to copy content. Check dev console for detail.', 0)
  }
}
</script>

<template>
  <FlakeFrame ref="$flake" class="flake-view">
    <div ref="$anchor" class="fp-markdown"></div>

    <div class="flake-tooltip">
      <button class="fp-btn-icon fp-danger" @click="emit('delete', flake.id)">
        <ObIcon name="trash-2" />
      </button>

      <div class="gap"></div>

      <button class="fp-btn-icon" @click="copyContent">
        <ObIcon name="copy" />
      </button>
      <button v-if="isDev" class="fp-btn-icon" @click="emit('pin', flake.id)">
        <ObIcon name="pin" />
      </button>
      <button class="fp-btn-icon" @click="emit('edit', flake.id)">
        <ObIcon name="pencil-line" />
      </button>
    </div>
  </FlakeFrame>
</template>

<style scoped lang="scss">
.flake-view {
  display: flex;
  align-items: center;

  padding: 0.5em;
}

.flake-tooltip {
  position: absolute;
  top: var(--size-4-1);
  left: var(--size-4-1);
  right: var(--size-4-1);
  z-index: 16;

  display: none; // flex when hovered
  column-gap: var(--size-4-1);
  pointer-events: none;

  > button {
    pointer-events: visible;
  }

  > .gap {
    flex-grow: 1;
  }
}

.flake-view:hover > .flake-tooltip {
  display: flex;
}
</style>
