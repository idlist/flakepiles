<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, useTemplateRef, type StyleValue } from 'vue'
import { MarkdownRenderer, moment, Notice, type App, type Component } from 'obsidian'
import { useTextareaAutosize } from '@vueuse/core'
import { isNullish } from '@rewl/kit'
import type { Flake } from '@/data'
import type { FileRef } from '@/app'
import { ObIcon } from '@/components'

const props = defineProps<{
  flake: Flake
  viewStyle?: StyleValue
}>()
const flake = props.flake
const isEmpty = () => !flake.content

const refFlake = useTemplateRef('el-flake')
const refContent = useTemplateRef('el-content')

const emit = defineEmits<{
  (e: 'init', id: string): void
  (e: 'update-height', id: string, height: number): void
}>()

const updateHeight = () => {
  const rect = refFlake.value!.getBoundingClientRect()
  emit('update-height', flake.id, rect.height)
}

const {
  textarea: editArea,
  input: editContent,
} = useTextareaAutosize({
  styleProp: 'minHeight',
  onResize() {
    updateHeight()
  },
})

const isEdit = ref(false)
const isView = computed(() => !isEdit.value)

const app = inject('app') as App
const leaf = inject('leaf') as Component
const fileRef = inject('fileRef') as FileRef
const requestArrange = inject('requestArrange') as () => Promise<void>
const requestDelete = inject('requestDelete') as (id: string) => Promise<void>

onMounted(async () => {
  await renderContent()
  await nextTick()
  updateHeight()
  emit('init', flake.id)
})

const renderContent = async () => {
  if (isNullish(fileRef.value)) return
  if (isEmpty()) return

  try {
    const elContent = refContent.value!
    elContent.innerHTML = ''

    await MarkdownRenderer.render(
      app,
      flake.content,
      elContent,
      fileRef.value.path,
      leaf,
    )
  } catch (e) {
    console.warn('Error rendering Flake content: ', e)
  }
}

const editBegin = async () => {
  isEdit.value = true
  editContent.value = flake.content

  await nextTick()
  updateHeight()
}

const editFinish = async () => {
  isEdit.value = false
  flake.content = editContent.value.trim()
  flake.modifiedAt = moment.now()

  await nextTick()
  await renderContent()

  await nextTick()
  updateHeight()
  await requestArrange()
}

const deleteAction = async () => {
  await requestDelete(flake.id)
}

const copyNotice = ref(false)

let copyNoticeHandler: number

const showCopyNotice = async () => {
  copyNotice.value = true

  copyNoticeHandler = setTimeout(() => {
    copyNotice.value = false
  }, 1000)
}

onUnmounted(() => {
  clearTimeout(copyNoticeHandler)
})

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(flake.content)
    showCopyNotice()
  } catch (e) {
    console.warn(`Failed to copy the content of Flake ${flake.id}: `, e)
    new Notice('Failed to copy. Check dev console for detail.', 0)
  }
}
</script>

<template>
  <div class="flake-frame">
    <div ref="el-flake"
      :class="['flake-view', `-${flake.theme}`]"
      :style="viewStyle">
      <div v-if="isView" class="name">{{ flake.name }}</div>
      <input v-if="isEdit" v-model="flake.name" class="nameedit" />

      <div class="divider"></div>

      <div v-if="isView && isEmpty()" class="nocontent">
        No Content
      </div>
      <div class="flake-content">
        <div v-if="isView && !isEmpty()"
          ref="el-content"
          class="view fp-markdown">
        </div>
        <textarea
          v-if="isEdit"
          ref="editArea"
          v-model="editContent"
          class="edit"
          rows="3"
          placeholder="Note here...">
        </textarea>
      </div>
    </div>

    <div class="flake-menu">
      <button v-if="isView" class="fp-btn-icon" @click="deleteAction">
        <ObIcon name="trash-2" css-color="var(--color-red)" />
      </button>
      <button v-if="isView" class="fp-btn-icon" @click="editBegin">
        <ObIcon name="pencil-line" />
      </button>
      <button v-if="isView" class="fp-btn-icon copy-button" @click="copyToClipboard">
        <ObIcon name="copy" />
        <div v-show="copyNotice" class="tooltip copynotice">Copied</div>
      </button>
      <button v-if="isEdit" class="fp-btn-icon" @click="editFinish">
        <ObIcon name="check" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/globals.scss' as *;

.flake-frame {
  display: grid;
  min-height: 0;
  max-height: 100%;
  position: relative;

  &:hover>.flake-menu {
    display: flex;
  }
}

.flake-view {
  min-height: 0;
  max-height: 100%;
  overflow: hidden;

  display: grid;
  grid-template-rows: min-content min-content auto;

  color: var(--flake-text);
  background-color: var(--flake-text-bg);

  border: var(--border-width) solid var(--flake-border);
  border-radius: var(--radius-s);
  box-shadow:
    0 0 4px var(--flake-shadow),
    1px 1px 2px var(--flake-shadow);

  %flake-name {
    padding: 0.375em 0.5em 0.25em 0.5em;
    line-height: 1.5;

    font-family: var(--font-default);
    font-size: var(--font-text-size);
    font-weight: var(--font-bold);

    color: var(--flake-name);
    background-color: var(--flake-name-bg);
  }

  >.name {
    @extend %flake-name;
    word-break: break-word;
    user-select: text;
  }

  >.nameedit {
    @extend %flake-name;
    border: none;
  }

  >.divider {
    border-bottom: var(--border-width) solid var(--flake-border);
  }

  >.nocontent {
    padding: 0.5em;
    font-size: var(--font-small);
    font-style: italic;
    color: var(--text-faint);
  }

  &.-default {
    --system-hsl: var(--accent-h) var(--accent-s) var(--accent-l);
    --flake-border: hsla(var(--system-hsl) / 0.25);
    --flake-shadow: hsla(var(--system-hsl) / 0.25);
    --flake-name: var(--text-accent);
    --flake-name-bg: var(--background-primary-alt);
    --flake-text: var(--text-normal);
    --flake-text-bg: var(--background-primary);
  }
}

.flake-content {
  display: flex;
  align-items: flex-start;
  width: 100%;
  overflow-y: auto;

  >.view {
    width: 100%;
    padding: 0 0.5em;
    font-size: var(--font-small);
    overflow-wrap: break-word;

    user-select: text;
  }

  >.edit {
    width: 100%;
    padding: 0.5em;
    font-size: var(--font-small);
    overflow-wrap: break-word;

    overflow: hidden;
    resize: none;
    border: none;
  }
}

.flake-menu {
  position: absolute;
  top: 0.25em;
  right: 0.25em;
  z-index: 4;

  display: none; // flex when hovered
  flex-direction: row;
  row-gap: 0.25em;
}

.copy-button {
  position: relative;

  .copynotice {
    position: absolute;
    bottom: -2.5em;
    overflow-wrap: break-word;
  }
}
</style>
