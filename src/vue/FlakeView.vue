<script setup lang="ts">
import { computed, inject, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { moment, Notice } from 'obsidian'
import { until, useDebounceFn, useElementSize, useTextareaAutosize } from '@vueuse/core'
import type { Flake, FlakeType } from '@/data'
import type { PileActions } from '@/app'
import { ObIcon } from '@/components'

const props = defineProps<{
  flake: Flake
  editing?: boolean
}>()

const emit = defineEmits<{
  (e: 'init', id: string): void
  (e: 'edit-begin', id: string): void
  (e: 'edit-finish', id: string): void
  (e: 'height-update', id: string, height: number): void
}>()

const isEmpty = computed(() => !props.flake.content)
const isTextlike = computed(() => {
  return !!props.flake.content && ['code', 'text'].includes(props.flake.type)
})
const isImage = computed(() => {
  return !!props.flake.content && props.flake.type == 'image'
})
const wrap = computed(() => {
  return props.flake.type == 'code' && props.flake.codeWrap
})

const viewing = computed(() => !props.editing)
const { textarea: editAreaRef, input: editContent } = useTextareaAutosize()
const editName = ref<string>('')

const actions = inject('actions') as PileActions

const flakeRef = useTemplateRef('el-flake')
const nameRef = useTemplateRef('el-name')
const contentRef = useTemplateRef('el-content')
const footerRef = useTemplateRef('el-footer')
const markdownRef = useTemplateRef('el-markdown')

const nameSize = useElementSize(nameRef)
const contentSize = useElementSize(contentRef)
const footerSize = useElementSize(footerRef)
const height = computed(() => {
  return 2 // Approximate border size, not accurate.
    + nameSize.height.value
    + contentSize.height.value
    + footerSize.height.value
  // TODO: add the height of horizontal scroll bar when overflows.
})

const requestReportHeight = useDebounceFn((height: number) => {
  emit('height-update', props.flake.id, height)
}, 10)

watch(height, (next, prev = 0) => {
  if (Math.abs(next - prev) < 1) return
  requestReportHeight(next)
}, { immediate: true })

watch([
  markdownRef,
  () => props.flake.content,
  () => props.editing,
], async () => {
  if (!markdownRef.value) return
  if (isEmpty.value) return
  if (props.editing) return

  await actions.renderContent(markdownRef.value, props.flake)
}, { immediate: true })

const editBegin = () => {
  editName.value = props.flake.name
  editContent.value = props.flake.content
  emit('edit-begin', props.flake.id)
}

const editFinish = async () => {
  emit('edit-finish', props.flake.id)
}

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
    props.flake.name = editName.value.trim()
    props.flake.content = editContent.value.trim()
    props.flake.modifiedAt = moment.now()
    actions.save()
  }
})

const deleteThis = () => {
  actions.deleteFlake(props.flake.id)
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.flake.content)
    new Notice('Content copied.', 1000)
  } catch (e) {
    console.warn(`Failed to copy the content of Flake ${props.flake.id}: `, e)
    new Notice('Failed to copy content. Check dev console for detail.', 0)
  }
}

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.flake, null, 2))
    new Notice('Raw JSON copied.', 1000)
  } catch (e) {
    console.warn(`Failed to copy the raw JSON of Flake ${props.flake.id}: `, e)
    new Notice('Failed to copy raw JSON. Check dev console for detail.', 0)
  }
}

type LightType = 'short' | 'long'

const light = ref<LightType | null>(null)
const lightDuration: Record<LightType, number> = {
  short: 500,
  long: 2000,
}
let lightHandle: number | undefined

const highlight = async (type: LightType) => {
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

defineExpose({
  root: flakeRef,
  highlight,
})

const modifierClass = computed(() => {
  return {
    [`-${props.flake.theme}`]: true,
    '-editing': props.editing,
    [`-light${light.value}`]: light.value != null,
  }
})

const typeButtonClass = (type: FlakeType) => {
  return {
    'selected': type == props.flake.type,
  }
}
</script>

<template>
  <div ref="el-flake" class="flake-view fp-flake-theme" :class="modifierClass">
    <div ref="el-name">
      <div v-if="viewing"
        class="flake-name -view">
        {{ flake.name }}
      </div>
      <input v-if="editing"
        v-model="editName"
        class="flake-name -edit" />
    </div>

    <div class="scrollable">
      <div ref="el-content" class="flake-content">
        <div v-if="viewing && isEmpty" class="none">
          No Content
        </div>

        <div v-if="viewing && isTextlike"
          ref="el-markdown"
          class="fp-markdown view"
          :class="[`-${flake.type}`, wrap ? '-wrap' : '-nowrap']">
        </div>

        <div v-if="viewing && isImage">
          <!-- TODO -->
        </div>

        <textarea v-if="editing"
          ref="editAreaRef"
          v-model="editContent"
          class="edit"
          :class="[`-${flake.type}`]"
          placeholder="Note here...">
        </textarea>
      </div>
    </div>

    <div ref="el-footer">
      <div v-if="editing" class="flake-edit">
        <div class="edit-options">
          <button
            class="fp-btn-icon"
            :class="typeButtonClass('text')"
            @click="flake.type = 'text'">
            <ObIcon name="type" />
          </button>
          <button
            class="fp-btn-icon"
            :class="typeButtonClass('image')"
            @click="flake.type = 'image'">
            <ObIcon name="image" />
          </button>
          <button
            class="fp-btn-icon"
            :class="typeButtonClass('code')"
            @click="flake.type = 'code'">
            <ObIcon name="code" />
          </button>

          <div class="expand"></div>

          <button class="fp-btn-icon">
            <ObIcon name="tag" />
          </button>
        </div>

        <div v-if="flake.type == 'code'" class="edit-options">
          <input v-model="flake.codeLang"
            type="text"
            class="expand codelang"
            placeholder="Language..." />

          <div class="gap"></div>

          <label class="group">
            <span>Wrap</span>
            <input v-model="flake.codeWrap" type="checkbox" />
          </label>
        </div>
      </div>
    </div>

    <div class="flake-menu">
      <button v-if="viewing" class="fp-btn-icon danger" @click="deleteThis">
        <ObIcon name="trash-2" />
      </button>

      <div class="grow"></div>

      <button v-if="viewing" class="fp-btn-icon" @click="copyJson">
        <ObIcon name="braces" />
      </button>
      <button v-if="viewing" class="fp-btn-icon" @click="copyContent">
        <ObIcon name="copy" />
      </button>
      <button v-if="viewing" class="fp-btn-icon" @click="editBegin">
        <ObIcon name="pencil-line" />
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

  --box-shadow:
    0 0 4px var(--flake-shadow),
    1px 1px 2px var(--flake-shadow);
  --box-shadow-heavy:
    0 0 8px var(--flake-shadow-heavy),
    1px 1px 4px var(--flake-shadow);

  border: var(--border-width) solid var(--flake-border);
  border-radius: var(--radius-s);
  box-shadow: var(--box-shadow);

  color: var(--flake-text);
  background-color: var(--flake-text-bg);

  position: relative;
  min-height: 0;
  max-height: 100%;

  display: grid;
  grid-template-rows: min-content auto min-content;

  &.-editing {
    box-shadow: var(--box-shadow-heavy);
    z-index: 10;
  }

  @keyframes light-short {
    0% {
      box-shadow: var(--box-shadow-heavy)
    }
  }

  &.-lightshort {
    animation: 0.5s linear light-short;
  }

  @keyframes light-long {
    0% {
      box-shadow: var(--box-shadow-heavy)
    }

    25% {
      box-shadow: var(--box-shadow-heavy)
    }
  }

  &.-lightlong {
    animation: 2s linear light-long;
  }

  &>.scrollable {
    width: 100%;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  &:hover>.flake-menu {
    display: flex;
  }
}

.flake-name {
  padding: 0.375em 0.5em 0.25em 0.5em;
  width: 100%;
  line-height: 1.5;
  min-height: calc(1lh + 0.625em);

  font-family: var(--font-default);
  font-size: var(--font-text-size);
  font-weight: var(--font-bold);

  color: var(--flake-name);
  background-color: var(--flake-name-bg);

  &.-view {
    word-break: break-word;
    user-select: text;
    border-bottom: var(--border-width) solid var(--flake-border);
  }

  &.-edit {
    padding-right: 40px;
    border: none;
    user-select: contain;
    border-bottom: var(--border-width) solid var(--flake-border);
  }
}

.flake-content {
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

  >.view.-code :deep(pre) {
    margin: 5px 0;
  }

  >.view.-wrap :deep(code) {
    white-space: pre-wrap;
  }

  >.view.-nowrap :deep(code) {
    white-space: pre;
  }

  >.edit {
    @extend %content-common;
    padding: 0.5em;
    overflow: hidden;
    overflow-wrap: break-word;
    resize: none;
    border: none;
    box-shadow: none;
    user-select: contain;
  }

  // The base size of textarea and rendered markdown has *subtle* difference.
  >.edit.-code {
    font-family: var(--font-monospace);
    font-size: var(--font-smaller);
    line-height: 1.45;
    letter-spacing: -0.25px;
  }
}

.flake-edit {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 0.25em;
  padding: 0.25em;

  background-color: var(--flake-name-bg);
  border-top: var(--border-width) solid var(--flake-border);
}

.edit-options {
  display: flex;
  align-items: center;
  column-gap: 0.25em;
  font-size: var(--font-ui-small);

  >.selected {
    color: var(--color-base-00);
    background-color: var(--text-accent);
  }

  >.expand {
    flex-grow: 1;
  }

  >.gap {
    width: 0.5em;
  }

  >.group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: 0.5em;
  }

  >.codelang,
  >.codelang:deep(::placeholder) {
    font-family: var(--font-monospace)
  }
}

.flake-menu {
  position: absolute;
  top: 0.25em;
  left: 0.25em;
  right: 0.25em;
  z-index: 20;

  display: none; // flex when hovered
  flex-direction: row;
  column-gap: 0.25em;
  pointer-events: none;

  >button {
    pointer-events: visible;
  }

  >.grow {
    flex-grow: 1;
  }

  >.danger {
    color: var(--color-base-00);
    background-color: var(--color-red);
  }
}
</style>
