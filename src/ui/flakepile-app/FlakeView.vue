<script setup lang="ts">
import type { FlakepilePlugin } from '@/custom-view'
import type { Flake } from '@/schemes/v1'
import { ObIcon } from '@/wrappers'
import { Notice } from 'obsidian'
import { inject, nextTick, onMounted, useTemplateRef, watch } from 'vue'
import FlakeFrame from './FlakeFrame.vue'

const props = defineProps<{
  flake: Flake
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const $flake = useTemplateRef('$flake')
const $anchor = useTemplateRef('$anchor')
const plugin = inject('plugin') as FlakepilePlugin

function tryCacheFlakeSize() {
  if (!$flake.value) return
  if (props.flake.cache.width !== 0) return
  if (props.flake.cache.height !== 0) return

  plugin.updateFlakeSizeCache(
    props.flake.id,
    $flake.value.$el.scrollWidth,
    $flake.value.$el.scrollHeight,
  )
}

onMounted(async () => {
  await plugin.renderContent($anchor.value!, props.flake.content)
  await nextTick()

  watch(
    () => props.flake.cache.width,
    tryCacheFlakeSize,
    { immediate: true },
  )
  watch(
    () => props.flake.cache.height,
    tryCacheFlakeSize,
    { immediate: true },
  )
})

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.flake.content)
    new Notice('Content copied.', 1000)
  } catch (e) {
    console.warn(`Failed to copy the content of Flake ${props.flake.id}: `, e)
    new Notice('Failed to copy content. Check dev console for detail.', 0)
  }
}
</script>

<template>
  <FlakeFrame ref="$flake" class="flake-view">
    <div class="flake-content">
      <div ref="$anchor" class="fp-markdown"></div>
    </div>

    <div class="flake-tooltip">
      <button class="fp-btn-icon fp-danger" @click="emit('delete', flake.id)">
        <ObIcon name="trash-2" />
      </button>

      <div class="grow"></div>

      <button class="fp-btn-icon" @click="copyContent">
        <ObIcon name="copy" />
      </button>
      <button class="fp-btn-icon" @click="emit('edit', flake.id)">
        <ObIcon name="pencil-line" />
      </button>
    </div>
  </FlakeFrame>
</template>

<style scoped lang="scss">
.flake-tooltip {
  position: absolute;
  top: var(--size-4-1);
  left: var(--size-4-1);
  right: var(--size-4-1);
  z-index: 20;

  display: none; // flex when hovered
  flex-direction: row;
  column-gap: var(--size-4-1);
  pointer-events: none;

  > button {
    pointer-events: visible;
  }

  > .grow {
    flex-grow: 1;
  }
}

.flake-view:hover > .flake-tooltip {
  display: flex;
}
</style>
