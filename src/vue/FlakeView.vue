<script setup lang="ts">
import { inject, nextTick, useTemplateRef, watch } from 'vue'
import { MarkdownRenderer, type App, type Component } from 'obsidian'
import { type Flake } from '@/data'
import type { FileRef } from '@/app'
import { isNullish } from '@rewl/kit'

const props = defineProps<{ flake: Flake }>()
const flake = props.flake
const elFlake = useTemplateRef('el-flake')
const elContent = useTemplateRef('el-content')

const emit = defineEmits<{
  (e: 'rendered', id: string, width: number, height: number): void
}>()

const app = inject('app') as App
const leaf = inject('leaf') as Component
const fileRef = inject('fileRef') as FileRef

watch([() => flake.content, fileRef, elContent], async () => {
  await RenderContent()
})

const RenderContent = async () => {
  if (!elFlake.value) return
  if (!elContent.value) return
  if (isNullish(fileRef.value)) return

  elContent.value.innerHTML = ''

  try {
    await MarkdownRenderer.render(
      app,
      flake.content,
      elContent.value,
      fileRef.value.path,
      leaf,
    )
  } finally {
    await nextTick()

    const rect = elFlake.value.getBoundingClientRect()

    emit(
      'rendered',
      flake.id,
      rect.width,
      rect.height,
    )
  }
}
</script>

<template>
  <div ref="el-flake" :class="['flake-view', `-${flake.theme}`]">
    <div class="name">{{ flake.name }}</div>
    <div class="divider"></div>
    <div ref="el-content" class="content flake-markdown"></div>
  </div>
</template>

<style lang="scss" scoped>
.flake-view {
  color: var(--flake-text);
  background-color: var(--flake-text-bg);

  border: 1px solid var(--flake-border);
  border-radius: var(--radius-s);
  box-shadow:
    0 0 4px var(--flake-shadow),
    1px 1px 2px var(--flake-shadow);

  &>.name {
    margin: 0.5em;
    margin-bottom: 0.25em;
    font-weight: bold;
    user-select: text;

    color: var(--flake-name);
    background-color: var(--flake-name-bg);
  }

  &>.divider {
    margin: 0.25em 0;
    border-bottom: 1px solid var(--flake-border);
  }

  &>.content {
    margin: 0.25em 0.5em;
    font-size: var(--font-small);
    user-select: text;
  }

  &.-default {
    --system-hsl: var(--accent-h) var(--accent-s) var(--accent-l);
    --flake-border: hsla(var(--system-hsl) / 0.5);
    --flake-shadow: hsla(var(--system-hsl) / 0.2);
    --flake-name: var(--text-accent);
    --flake-name-bg: var(--background-primary-alt);
    --flake-text: var(--text-normal);
    --flake-text-bg: var(--background-primary);
  }
}
</style>

<style lang="scss">
.flake-markdown {
  & p {
    margin: 0.5em 0;
  }
}
</style>
