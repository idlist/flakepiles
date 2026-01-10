<script setup lang="ts">
import { computed, inject, nextTick, onUnmounted, ref, useTemplateRef, watch, type StyleValue } from 'vue'
import { MarkdownRenderer, moment, Notice, type App, type Component } from 'obsidian'
import { useElementSize, useTextareaAutosize, useThrottleFn, watchDebounced } from '@vueuse/core'
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
const { textarea: editArea, input: editContent } = useTextareaAutosize()

const app = inject('app') as App
const leaf = inject('leaf') as Component
const fileRef = inject('fileRef') as FileRef
const actions = inject('actions') as PileActions

const refFlake = useTemplateRef('el-flake')
const refName = useTemplateRef('el-name')
const refContent = useTemplateRef('el-content')
const refMarkdownAnchor = useTemplateRef('el-markdown-anchor')

// Might need nextTick() to wait for rendering.
const getFrameBorderHeight = (): number => {
  if (!refFlake.value) return 0
  const styles = window.getComputedStyle(refFlake.value)
  const top = parseFloat(styles.borderTopWidth)
  const bottom = parseFloat(styles.borderBottomWidth)
  return top + bottom
}

const nameSize = useElementSize(refName)
const contentSize = useElementSize(refContent)
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
    const elMarkdownAnchor = refMarkdownAnchor.value!
    elMarkdownAnchor.innerHTML = ''

    await MarkdownRenderer.render(
      app,
      props.flake.content,
      elMarkdownAnchor,
      fileRef.value!.path,
      leaf,
    )
  } catch (e) {
    console.warn('Error rendering Flake content: ', e)
  }
}

watch([
  refMarkdownAnchor,
  () => props.flake.content,
  () => props.editing,
], async () => {
  if (!refMarkdownAnchor.value) return
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

watch(() => props.editing, (next, prev) => {
  if (prev && !next) {
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

const light = ref(false)
const lightAfter = ref(false)
const lightTime = ref(1000)
let lightAfterHandle: number

const highlight = async () => {
  light.value = true
  await nextTick()
  light.value = false
}

watch(() => light.value, (value) => {
  clearTimeout(lightAfterHandle)

  if (value) {
    lightAfter.value = false
  } else {
    lightAfter.value = true
    lightAfterHandle = setTimeout(() => {
      lightAfter.value = false
    }, lightTime.value)
  }
})

watch(() => props.editing, () => {
  clearTimeout(lightAfterHandle)
  lightAfter.value = false
})

onUnmounted(() => {
  clearTimeout(lightAfterHandle)
})

defineExpose({
  highlight,
})

const outerClass = computed<Record<string, boolean>>(() => {
  return {
    [`-${props.flake.theme}`]: true,
    '-editing': props.editing,
    '-light': light.value,
    '-light-after': lightAfter.value,
  }
})
</script>

<template>
  <div class="flake-view fp-flake-theme" :class="outerClass">
    <div ref="el-flake" class="flake-card" :style="innerStyle">
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
            ref="editArea"
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

  &.-editing {
    box-shadow:
      0 0 8px var(--flake-shadow-heavy),
      1px 1px 4px var(--flake-shadow);
    z-index: 10;
  }

  &.-light {
    box-shadow:
      0 0 8px var(--flake-shadow-heavy),
      1px 1px 4px var(--flake-shadow);
  }

  &.-light-after {
    transition: box-shadow v-bind('`${lightTime / 1000}s`') ease-in;
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
