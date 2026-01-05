<script setup lang="ts">
import { computed, inject, nextTick, onMounted, useTemplateRef } from 'vue'
import { MarkdownRenderer, moment, type App, type Component } from 'obsidian'
import { useTextareaAutosize } from '@vueuse/core'
import type { Flake } from '@/data'
import type { FileRef } from '@/app'
import { isNullish } from '@rewl/kit'
import ObIcon from './ObIcon.vue'

const props = defineProps<{
  flake: Flake
  edit: boolean
}>()
const flake = props.flake
const hasContent = computed(() => !!flake.content)

const emit = defineEmits<{
  (e: 'size-init', id: string, height: number): void
  (e: 'size-update', id: string, height: number): void
  (e: 'edit', id: string, state: 'begin' | 'finish'): void
  (e: 'delete', id: string): void
}>()

const refFlake = useTemplateRef('el-flake')
const refContent = useTemplateRef('el-content')

const {
  textarea: editArea,
  input: editContent,
} = useTextareaAutosize({
  styleProp: 'minHeight',
  onResize() {
    sizeUpdate()
  },
})

const isView = computed(() => !props.edit)
const isEdit = computed(() => props.edit)

const app = inject('app') as App
const leaf = inject('leaf') as Component
const fileRef = inject('fileRef') as FileRef

const sizeInit = () => {
  const rect = refFlake.value!.getBoundingClientRect()
  emit('size-init', flake.id, rect.height)
}

const sizeUpdate = () => {
  const rect = refFlake.value!.getBoundingClientRect()
  emit('size-update', flake.id, rect.height)
}

onMounted(async () => {
  await renderContent()
})

const renderContent = async () => {
  if (isNullish(fileRef.value)) return

  try {
    if (hasContent.value) {
      const elContent = refContent.value!
      elContent.innerHTML = ''

      await MarkdownRenderer.render(
        app,
        flake.content,
        elContent,
        fileRef.value.path,
        leaf,
      )
    }
  } finally {
    await nextTick()
    sizeInit()
  }
}

const beginEdit = async () => {
  editContent.value = flake.content

  emit('edit', flake.id, 'begin')
  await nextTick()
  sizeUpdate()
}

const finishEdit = async () => {
  flake.content = editContent.value.trim()
  flake.modifiedAt = moment.now()

  emit('edit', flake.id, 'finish')
  await renderContent()
}

const deleteFlake = () => {
  emit('delete', flake.id)
}
</script>

<template>
  <div class="flake-layout">
    <div ref="el-flake" :class="['flake-view', `-${flake.theme}`]">
      <div v-if="isView" class="name">{{ flake.name }}</div>
      <input v-if="isEdit" v-model="flake.name" class="edit-name" />

      <div class="divider"></div>

      <div v-if="isView && !hasContent" class="nocontent">
        No Content
      </div>
      <div v-if="isView && hasContent"
        ref="el-content"
        class="content _fp-markdown">
      </div>
      <div v-if="isEdit" class="edit-content">
        <textarea
          ref="editArea"
          v-model="editContent"
          class="textarea"
          rows="3"
          placeholder="Note here...">
        </textarea>
      </div>
    </div>

    <div class="tooltip-top">
      <button v-if="isView" class="_fp-btn-icon" @click="beginEdit">
        <ObIcon name="pencil-line" />
      </button>
      <button v-if="isView" class="_fp-btn-icon" @click="deleteFlake">
        <ObIcon name="trash-2" css-color="var(--color-red)" />
      </button>
      <button v-if="isEdit" class="_fp-btn-icon" @click="finishEdit">
        <ObIcon name="check" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
%flake-name {
  padding: 0.5em;
  padding-bottom: 0.25em;
  line-height: 1.5;

  font-family: var(--font-default);
  font-size: var(--font-text-size);
  font-weight: var(--font-bold);

  color: var(--flake-name);
  background-color: var(--flake-name-bg);
}

.flake-layout {
  max-height: 100%;
  position: relative;

  &:hover>.tooltip-top {
    display: flex;
  }
}

.flake-view {
  max-height: 100%;
  overflow: hidden;

  display: grid;
  grid-template-rows: min-content min-content auto;

  color: var(--flake-text);
  background-color: var(--flake-text-bg);

  border: 1px solid var(--flake-border);
  border-radius: var(--radius-s);
  box-shadow:
    0 0 4px var(--flake-shadow),
    1px 1px 2px var(--flake-shadow);

  &>.name {
    @extend %flake-name;
    word-break: break-word;
    user-select: text;
  }

  &>.divider {
    border-bottom: 1px solid var(--flake-border);
  }

  &>.nocontent {
    padding: 0.5em;
    font-size: var(--font-small);
    font-style: italic;
    color: var(--text-faint);
  }

  &>.content {
    padding: 0 0.5em;
    font-size: var(--font-small);
    user-select: text;
    overflow-y: auto;
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

.edit-name {
  @extend %flake-name;
  border: none;
}

.edit-content {
  display: flex;
  max-height: 100%;
  overflow-y: auto;

  &>.textarea {
    width: 100%;
    padding: 0.5em;
    resize: none;
    border: none;
    font-size: var(--font-small);
  }
}

.tooltip-top {
  position: absolute;
  top: 0.25em;
  right: 0.25em;
  z-index: 4;

  display: none; // flex when hovered
  flex-direction: column;
  row-gap: 0.25em;
}
</style>
