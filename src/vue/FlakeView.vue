<script setup lang="ts">
import { computed, inject, onUnmounted, ref, useTemplateRef, watch, type StyleValue } from 'vue'
import { MarkdownRenderer, moment, Notice, type App, type Component } from 'obsidian'
import { until, useElementSize, useTextareaAutosize, useThrottleFn, watchDebounced } from '@vueuse/core'
import type { Flake } from '@/data'
import type { FileRef, PileActions } from '@/app'
import { ObIcon } from '@/components'

const props = defineProps<{
  flake: Flake
  editing?: boolean
  innerStyle?: StyleValue
}>()

const emit = defineEmits<{
  (e: 'init', id: string): void
  (e: 'edit-begin', id: string): void
  (e: 'edit-finish', id: string): void
  (e: 'height-update', id: string, height: number): void
}>()

const empty = () => !props.flake.content

const viewing = computed(() => !props.editing)
const { textarea: editAreaRef, input: editContent } = useTextareaAutosize()

const app = inject('app') as App
const leaf = inject('leaf') as Component
const fileRef = inject('fileRef') as FileRef
const actions = inject('actions') as PileActions

const flakeRef = useTemplateRef('el-flake')
const nameRef = useTemplateRef('el-name')
const contentRef = useTemplateRef('el-content')
const markdownAnchorRef = useTemplateRef('el-markdown-anchor')

// Might need nextTick() to wait for rendering.
const getFrameBorderHeight = (): number => {
  if (!flakeRef.value) return 0
  const styles = window.getComputedStyle(flakeRef.value)
  const top = parseFloat(styles.borderTopWidth)
  const bottom = parseFloat(styles.borderBottomWidth)
  return top + bottom
}

const nameSize = useElementSize(nameRef)
const contentSize = useElementSize(contentRef)
const height = computed(() => {
  return getFrameBorderHeight()
    + nameSize.height.value
    + contentSize.height.value
})

watchDebounced(height, (next, prev) => {
  if (Math.abs(next - prev) < 1) return
  emit('height-update', props.flake.id, next)
}, { debounce: 10 })

const renderContent = async () => {
  try {
    const markdownAnchorEl = markdownAnchorRef.value!
    markdownAnchorEl.innerHTML = ''

    await MarkdownRenderer.render(
      app,
      props.flake.content,
      markdownAnchorEl,
      fileRef.value!.path,
      leaf,
    )
  } catch (e) {
    console.warn('Error rendering Flake content: ', e)
  }
}

watch([
  markdownAnchorRef,
  () => props.flake.content,
  () => props.editing,
], async () => {
  if (!markdownAnchorRef.value) return
  if (empty()) return
  if (props.editing) return
  renderContent()
}, { immediate: true })

const editBegin = () => {
  editContent.value = props.flake.content
  emit('edit-begin', props.flake.id)
}

const editFinish = async () => {
  emit('edit-finish', props.flake.id)
}

const lazyContent = useThrottleFn(() => {
  props.flake.content = editContent.value.trim()
}, 100)

const lazyModifiedAt = useThrottleFn(() => {
  props.flake.modifiedAt = moment.now()
}, 100)

watch(() => props.flake.name, () => {
  if (!props.editing) return

  lazyModifiedAt()
  actions.saveLazy()
})

watch(editContent, () => {
  if (!props.editing) return

  lazyContent()
  lazyModifiedAt()
  actions.saveLazy()
})

const requestFocusEditArea = async () => {
  await until(editAreaRef).toBeTruthy({ timeout: 1000 })
  const editAreaEl = editAreaRef.value!
  editAreaEl.focus()
}

watch(() => props.editing, () => {
  if (props.editing) {
    requestFocusEditArea()
  }
  else {
    props.flake.content = editContent.value.trim()
    props.flake.modifiedAt = moment.now()
    actions.save()
  }
})

const deleteThis = () => {
  actions.deleteFlake(props.flake.id)
}

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.flake.content)
    new Notice('Copied!', 1000)
  } catch (e) {
    console.warn(`Failed to copy the content of Flake ${props.flake.id}: `, e)
    new Notice('Failed to copy. Check dev console for detail.', 0)
  }
}

type LightType = 'short' | 'long'

const light = ref<LightType | null>(null)
const lightDuration: Record<LightType, number> = {
  short: 500,
  long: 1000,
}
let lightHandle: number | undefined

const highlight = async (type: LightType)=> {
  clearTimeout(lightHandle)

  light.value = type
  lightHandle = setTimeout(() => {
    light.value = null
    clearTimeout(lightHandle)
  }, lightDuration[type])
}

watch(() => props.editing, () => {
  if (props.editing) {
    light.value = null
    clearTimeout(lightHandle)
  }
  else {
    highlight('short')
  }
})

onUnmounted(() => {
  clearTimeout(lightHandle)
})

const scrollIntoView = () => {
  return flakeRef.value?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
}

defineExpose({
  highlight,
  scrollIntoView,
})

const outerClass = computed<Record<string, boolean>>(() => {
  return {
    [`-${props.flake.theme}`]: true,
    '-editing': props.editing,
    [`-light${light.value}`]: light.value != null,
  }
})
</script>

<template>
  <div ref="el-flake" class="flake-view fp-flake-theme" :class="outerClass">
    <div class="flake-card" :style="innerStyle">
      <div ref="el-name">
        <div v-if="viewing" class="name">{{ flake.name }}</div>
        <input v-if="editing" v-model="flake.name" class="nameedit" />
      </div>

      <div class="content">
        <div ref="el-content" class="content-scroll">
          <div v-if="viewing && empty()" class="none">
            No Content
          </div>
          <div v-if="viewing && !empty()"
            ref="el-markdown-anchor"
            class="view fp-markdown">
          </div>
          <textarea v-if="editing"
            ref="editAreaRef"
            v-model="editContent"
            class="edit"
            rows="3"
            placeholder="Note here...">
        </textarea>
        </div>
      </div>
    </div>

    <div class="flake-menu">
      <button v-if="viewing" class="fp-btn-icon -red" @click="deleteThis">
        <ObIcon name="trash-2" />
      </button>
      <button v-if="viewing" class="fp-btn-icon" @click="editBegin">
        <ObIcon name="pencil-line" />
      </button>
      <button v-if="viewing" class="fp-btn-icon" @click="copy">
        <ObIcon name="copy" />
      </button>
      <button v-if="editing" class="fp-btn-icon" @click="editFinish">
        <ObIcon name="check" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" src="./FlakeViewThemes.scss" />

<style lang="scss" scoped>
@use '@/globals.scss' as *;

.flake-view {
  content-visibility: auto;

  border: var(--border-width) solid var(--flake-border);
  border-radius: var(--radius-s);
  box-shadow:
    0 0 4px var(--flake-shadow),
    1px 1px 2px var(--flake-shadow);

  display: grid;
  min-height: 0;
  max-height: 100%;
  position: relative;

  @keyframes lightout {
    0% {
      box-shadow:
        0 0 8px var(--flake-shadow-heavy),
        1px 1px 4px var(--flake-shadow);
    }
  }

  &.-editing {
    box-shadow:
      0 0 8px var(--flake-shadow-heavy),
      1px 1px 4px var(--flake-shadow);
    z-index: 10;
  }

  &.-lightshort {
    animation: 0.5s ease-out lightout;
  }

  &.-lightlong {
    animation: 1s ease-out lightout;
  }

  &:hover>.flake-menu {
    display: flex;
  }
}

.flake-card {
  min-height: 0;
  max-height: 100%;
  overflow: hidden;

  display: grid;
  grid-template-rows: min-content auto;

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

  & .name {
    @extend %flake-name;
    word-break: break-word;
    user-select: text;
    border-bottom: var(--border-width) solid var(--flake-border);
  }

  & .nameedit {
    @extend %flake-name;
    border: none;
    border-bottom: var(--border-width) solid var(--flake-border);
  }

  & .content {
    overflow-y: auto;
    scrollbar-gutter: stable;
  }
}

.content-scroll {
  width: 100%;
  display: flex;
  align-items: flex-start;

  >%content-common {
    width: 100%;
    font-size: var(--font-small);
  }

  >.none {
    @extend %content-common;
    padding: 0.5em;
    font-style: italic;
    color: var(--text-faint);
  }

  >.view {
    @extend %content-common;
    padding: 0 0.5em;
    overflow-wrap: break-word;
    user-select: text;
  }

  >.edit {
    @extend %content-common;
    padding: 0.5em;
    overflow: hidden;
    overflow-wrap: break-word;
    resize: none;
    border: none;
  }
}

.flake-menu {
  position: absolute;
  top: 0.25em;
  right: 0.25em;
  z-index: 20;

  display: none; // flex when hovered
  flex-direction: row;
  column-gap: 0.25em;
}
</style>
