<script setup lang="ts">
import { inject, nextTick, useTemplateRef, watch } from 'vue'
import { MarkdownRenderer, type App, type Component } from 'obsidian'
import { type Flake } from './data'
import type { FileRef } from './app'
import { isNullish } from '@rewl/kit'

const props = defineProps<{ flake: Flake }>()
const flake = props.flake
const elFlake = useTemplateRef('el-flake')
const elContent = useTemplateRef('el-content')

const emit = defineEmits<{
  (e: 'rendered', createdAt: number, width: number, height: number): void
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
  await MarkdownRenderer.render(
    app,
    flake.content,
    elContent.value,
    fileRef.value.path,
    leaf,
  )

  await nextTick()
  emit(
    'rendered',
    flake.createdAt,
    elFlake.value.offsetWidth,
    elFlake.value.offsetHeight,
  )
}
</script>

<template>
  <div ref="el-flake" :class="['flake-view', `-${flake.theme}`]">
    <h5 class="title">{{ flake.name }}</h5>
    <div class="divider"></div>
    <div ref="el-content" class="content flake-markdown"></div>
  </div>
</template>

<style lang="scss" scoped>
.flake-view {
  border: 1px solid var(--flake-border);
  border-radius: 0.5em;

  &>.title {
    margin: 0.25em 0.5em;
  }

  &>.divider {
    margin: 0 0.5em;
    border-bottom: 1px solid var(--flake-border);
  }

  &>.content {
    margin: 0.5em;
    font-size: var(--font-small)
  }

  &.-default {
    --flake-border: oklch(62.5% 0.19 291);
  }
}
</style>

<style lang="scss">
.flake-markdown {
  & p {
    margin: 0.5rem 0;
  }
}
</style>
