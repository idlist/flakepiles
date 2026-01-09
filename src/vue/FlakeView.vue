<script setup lang="ts">
import { computed, inject, onMounted, ref, useTemplateRef, watch, type StyleValue } from 'vue'
import { MarkdownRenderer, moment, Notice, type App, type Component } from 'obsidian'
import { useResizeObserver, useTextareaAutosize, useThrottleFn, watchDebounced } from '@vueuse/core'
import type { Flake } from '@/data'
import type { FileRef, PileActions } from '@/app'
import { ObIcon } from '@/components'

const props = defineProps<{
  flake: Flake
  editing: boolean
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

const heightRecord = ref(0)

watchDebounced(heightRecord, (next, prev) => {
  if (Math.abs(next - prev) < 1) return
  emit('height-update', props.flake.id, next)
}, { debounce: 10 })

onMounted(() => {
  useResizeObserver([refName, refContent], (entries) => {
    let height = 0
    for (const entry of entries) {
      const sizes = entry.borderBoxSize
      for (const size of sizes) {
        height += size.blockSize
      }
    }
    height += getFrameBorderHeight()
    heightRecord.value = height
  })
})

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

const innerClass = computed<string[]>(() => {
  const css = ['fp-flake-theme', `-${props.flake.theme}`]
  if (props.editing) css.push('-editing')
  return css
})
</script>

<template>
  <div class="flake-view">
    <div ref="el-flake" :class="innerClass" :style="innerStyle">
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
  display: grid;
  min-height: 0;
  max-height: 100%;
  position: relative;

  &:hover>.flake-menu {
    display: flex;
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
  z-index: 4;

  display: none; // flex when hovered
  flex-direction: row;
  row-gap: 0.25em;
}
</style>
