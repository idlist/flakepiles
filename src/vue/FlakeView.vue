<script setup lang="ts">
import { computed, inject, nextTick, onUnmounted, ref, useTemplateRef, watch, watchEffect, type Ref } from 'vue'
import { moment, Notice } from 'obsidian'
import { until, useDebounceFn, useEventListener, useResizeObserver, useTextareaAutosize } from '@vueuse/core'
import type { ImageRawSize, PileActions } from '@/view'
import type { Flake } from '@/data'
import { ObIcon } from '@/components'
import { useCssIf, px, useCssWith, CausedError, useElementBorderSize } from '@/utils'

const props = defineProps<{
  flake: Flake
  width: number
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'init', id: string): void
  (e: 'edit-begin', id: string): void
  (e: 'edit-finish', id: string): void
  (e: 'height-update', id: string, height: number): void
}>()

const isDev = inject('isDev') as Ref<boolean>
const isView = computed(() => !props.isEdit)

const isEmpty = computed(() => !props.flake.content)
const isText = computed(() => props.flake.type == 'text')
const isCode = computed(() => props.flake.type == 'code')
const isImage = computed(() => props.flake.type == 'image')

const actions = inject('actions') as PileActions
const imageRawSize = ref<ImageRawSize | null>(null)

type MountErrorCause = null | 'image' | 'markdown'

const mountError = ref<MountErrorCause>(null)

const mountErrorMessage = (e: MountErrorCause): string => {
  if (e == 'image') {
    return `Cannot find image "${props.flake.content}".`
  }
  else if (e == 'markdown') {
    return `Cannot parse markdown content.`
  }
  else {
    return `Unknown error.`
  }
}

const imageLoaded = computed(() => isImage.value && !mountError.value)

const imageOnly = computed(() => {
  return isView.value
    && imageLoaded.value
    && props.flake.imageOnly
})

const flakeRef = useTemplateRef('el-flake')
const nameRef = useTemplateRef('el-name')
const scrollableRef = useTemplateRef('el-scrollable')
const footerRef = useTemplateRef('el-footer')
const contentRef = useTemplateRef('el-content')
const mountRef = useTemplateRef('el-mount')
const textareaRef = useTemplateRef('el-textarea')

const editName = ref<string>('')
const editContent = ref<string>('')

const { triggerResize } = useTextareaAutosize({
  element: textareaRef,
  input: editContent,
})

const noWrap = computed(() => isCode.value && !props.flake.codeWrap)

watch(noWrap, async () => {
  await nextTick()
  triggerResize()
  syncTextareaWidth()
})

const syncTextareaWidth = () => {
  if (!noWrap.value) return
  if (!textareaRef.value) return

  const textareaEl = textareaRef.value
  const bleed = 16
  textareaEl.style.width = `calc(100% - ${bleed}px)`
  textareaEl.style.width = px(textareaEl.scrollWidth + bleed)
}

watch(() => props.isEdit, async (value) => {
  if (value) {
    await nextTick()
    syncTextareaWidth()
  }
})

useEventListener(textareaRef, 'input', () => {
  syncTextareaWidth()
})

const nameSize = useElementBorderSize(nameRef)
const contentSize = useElementBorderSize(contentRef)
const footerSize = useElementBorderSize(footerRef)
const scrollBarHeight = ref(0)

useResizeObserver(scrollableRef, (entries) => {
  const entry = entries[0]!
  const el = entry.target as HTMLElement
  scrollBarHeight.value = el.offsetHeight - el.clientHeight
})

const contentHeight = ref(0)

watchEffect(async () => {
  if (isView.value && isImage.value && imageRawSize.value) {
    if (props.flake.enableRatio && props.flake.ratio) {
      const ratio = Math.clamp(props.flake.ratio, 0.25, 4)
      contentHeight.value = props.width * ratio
    }
    else {
      const { width: w, height: h } = imageRawSize.value
      contentHeight.value = props.width / w * h
    }
  }
  else {
    contentHeight.value = contentSize.height.value
  }
})

const height = computed(() => {
  return 2 // Slightly larger than the border size
    + nameSize.height.value
    + contentHeight.value
    + footerSize.height.value
    + scrollBarHeight.value
})

const requestReportHeight = useDebounceFn((height: number) => {
  emit('height-update', props.flake.id, height)
}, 1)

watch(height, (next, prev = 0) => {
  if (Math.abs(next - prev) < 1) return

  requestReportHeight(next)
}, { immediate: true })

watchEffect(async () => {
  if (!mountRef.value) return
  if (isEmpty.value) return
  if (props.isEdit) return

  try {
    const result = await actions.mountContent(mountRef.value, props.flake)

    if (isImage.value) {
      imageRawSize.value = result!
    }

    mountError.value = null
  } catch (e) {
    if (e instanceof CausedError && e.cause == 'noImage') {
      mountError.value = 'image'
    }
    else {
      console.warn('Failed to render content: ', e)
      mountError.value = 'markdown'
    }

    imageRawSize.value = null
  }
})

const editBegin = () => {
  emit('edit-begin', props.flake.id)
}

const editFinish = async () => {
  emit('edit-finish', props.flake.id)
}

const requestFocusEditArea = async () => {
  await until(textareaRef).toBeTruthy({ timeout: 1000 })
  textareaRef.value!.focus()
}

watch(() => props.isEdit, () => {
  if (props.isEdit) {
    editName.value = props.flake.name
    editContent.value = props.flake.content
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
    console.warn(`Failed to copy the content of flake ${props.flake.id}: `, e)
    new Notice('Failed to copy content. Check dev console for detail.', 0)
  }
}

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.flake, null, 2))
    new Notice('Raw JSON copied.', 1000)
  } catch (e) {
    console.warn(`Failed to copy the raw JSON of flake ${props.flake.id}: `, e)
    new Notice('Failed to copy raw JSON. Check dev console for detail.', 0)
  }
}

const textareaPlaceholder = computed<string>(() => {
  if (isCode.value) {
    return 'Code here...'
  }
  else if (isImage.value) {
    return 'Relative path to the image here...'
  }
  else {
    return 'Note here...'
  }
})

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

watch(() => props.isEdit, () => {
  if (props.isEdit) {
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

const cssTheme = useCssWith(() => props.flake.theme, (v) => `-${v}`)
const cssIsEdit = useCssIf(() => props.isEdit, '-editing')
const cssLight = useCssWith(light, (v) => `-light${v}`)

const cssIsCode = useCssIf(isCode, '-code')
const cssIsImage = useCssIf(isImage, '-image')
const cssNoWrap = useCssIf(noWrap, '-nowrap')
const cssViewImage = useCssIf(() => isView.value && imageLoaded.value, '-viewimage')

const cssTypeIsText = useCssIf(isText, 'selected')
const cssTypeIsCode = useCssIf(isCode, 'selected')
const cssTypeIsImage = useCssIf(isImage, 'selected')
</script>

<template>
  <div ref="el-flake"
    :class="['flake-view', 'fp-flake-theme', cssTheme, cssIsEdit, cssLight]">
    <div v-if="!imageOnly" ref="el-name" class="flake-name">
      <div v-if="isText" class="noicon"></div>

      <div v-else class="icon">
        <ObIcon v-if="isCode" name="code" />
        <ObIcon v-if="isImage" name="image" />
      </div>

      <div v-if="isView" class="view">
        {{ flake.name }}
      </div>

      <input v-if="isEdit"
        v-model="editName"
        class="edit" />
    </div>

    <div ref="el-scrollable" :class="['scrollable', cssViewImage]">
      <div ref="el-content"
        :class="['flake-content', cssViewImage]">
        <div v-if="isView && isEmpty" class="none">
          No content
        </div>

        <div v-if="isView"
          v-show="!mountError"
          ref="el-mount"
          :class="['fp-markdown', 'view', cssIsImage, cssIsCode, cssNoWrap]">
        </div>

        <div v-if="isView && mountError"
          class="view">
          <p class="flake-mount-error">
            {{ mountErrorMessage(mountError) }}
          </p>
        </div>

        <textarea v-if="isEdit"
          ref="el-textarea"
          v-model="editContent"
          :class="['edit', cssIsImage, cssIsCode, cssNoWrap]"
          :placeholder="textareaPlaceholder">
    </textarea>
      </div>
    </div>

    <div ref="el-footer">
      <div v-if="isEdit" class="flake-edit-tools">
        <div class="flake-edit-row">
          <button
            :class="['fp-btn-icon', cssTypeIsText]"
            @click="flake.type = 'text'">
            <ObIcon name="type" />
          </button>
          <button
            :class="['fp-btn-icon', cssTypeIsImage]"
            @click="flake.type = 'image'">
            <ObIcon name="image" />
          </button>
          <button
            :class="['fp-btn-icon', cssTypeIsCode]"
            @click="flake.type = 'code'">
            <ObIcon name="code" />
          </button>

          <div class="expand"></div>

          <button v-if="isDev" class="fp-btn-icon">
            <ObIcon name="tag" />
          </button>

          <button v-if="isDev" class="fp-btn-icon">
            <ObIcon name="palette" />
          </button>
        </div>

        <div v-if="isCode" class="flake-edit-row">
          <input v-model="flake.codeLang"
            type="text"
            class="expand codelang"
            placeholder="Language..." />

          <div class="gap"></div>

          <label class="withlabel -atleft">
            <span>Wrap</span>
            <input v-model="flake.codeWrap" type="checkbox" />
          </label>
        </div>

        <div v-if="isImage" class="flake-edit-row">
          <input v-model="flake.ratio"
            type="number"
            class="flake-ratio-value"
            placeholder="0.25 - 4"
            :disabled="!flake.enableRatio" />

          <label class="withlabel -atright">
            <input v-model="flake.enableRatio" type="checkbox" />
            <span>Ratio</span>
          </label>

          <div class="expand"></div>

          <label class="withlabel -atleft">
            <span>Image only</span>
            <input v-model="flake.imageOnly" type="checkbox" />
          </label>
        </div>
      </div>
    </div>

    <div class="flake-menu">
      <button v-if="isView" class="fp-btn-icon danger" @click="deleteThis">
        <ObIcon name="trash-2" />
      </button>

      <div class="grow"></div>

      <button v-if="isView" class="fp-btn-icon" @click="copyJson">
        <ObIcon name="braces" />
      </button>
      <button v-if="isView" class="fp-btn-icon" @click="copyContent">
        <ObIcon name="copy" />
      </button>
      <button v-if="isView" class="fp-btn-icon" @click="editBegin">
        <ObIcon name="pencil-line" />
      </button>
      <button v-if="isEdit" class="fp-btn-icon" @click="editFinish">
        <ObIcon name="check" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" src="./FlakeViewThemes.scss" />

<style lang="scss" scoped>
@use '@/globals.scss' as *;

.flake-view {
  overflow: hidden;
  content-visibility: auto;

  --box-shadow:
    0 0 4px var(--flake-shadow),
    1px 1px 2px var(--flake-shadow);
  --box-shadow-heavy:
    0 0 8px var(--flake-shadow-heavy),
    1px 1px 4px var(--flake-shadow);

  border: var(--border-width) solid var(--flake-border);
  border-radius: var(--radius-m);
  box-shadow: var(--box-shadow);

  color: var(--flake-text);
  background-color: var(--flake-text-bg);

  position: relative;
  min-height: 0;
  max-height: 100%;

  display: flex;
  flex-direction: column;

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
    flex-grow: 1;
    flex-shrink: 1;

    width: 100%;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  &>.scrollable.-viewimage {
    overflow: hidden;
    scrollbar-gutter: auto;
  }

  &:hover>.flake-menu {
    display: flex;
  }
}

.flake-name {
  flex-shrink: 0;
  display: flex;
  align-items: center;

  width: 100%;
  color: var(--flake-name);
  background-color: var(--flake-name-bg);
  border-bottom: var(--border-width) solid var(--flake-border);

  >.noicon {
    padding-left: var(--size-4-1);
  }

  >.icon {
    padding-left: var(--size-4-2);
    padding-top: var(--size-4-2);
    padding-bottom: var(--size-4-1);
  }

  >.noicon {
    padding-left: var(--size-4-1);
  }

  >%name {
    width: 100%;
    min-height: 1lh;
    padding-left: var(--size-4-1);
    padding-right: var(--size-4-2);
    padding-top: var(--size-4-2);
    padding-bottom: var(--size-4-1);

    line-height: 1.5;
    font-family: var(--font-default);
    font-size: var(--font-text-size);
    font-weight: var(--font-bold);

    color: var(--flake-name);
    background-color: transparent;
  }

  >.view {
    @extend %name;

    word-break: break-word;
    user-select: text;
  }

  >.edit {
    @extend %name;

    padding-right: 40px;
    border: none;
  }
}

.flake-content {
  width: 100%;

  display: flex;
  align-items: flex-start;

  &.-viewimage {
    height: 100%;
  }

  >%content-common {
    width: 100%;
    background-color: transparent;
    min-height: auto;
    font-size: var(--font-small);
  }

  >.none {
    @extend %content-common;
    padding: var(--size-4-2);
    font-style: italic;
    color: var(--text-faint);
  }

  >.view {
    @extend %content-common;
    padding: var(--size-2-1) var(--size-4-2);
    overflow-wrap: break-word;
    user-select: text;
  }

  >.view.-image {
    display: flex;
    padding: 0;

    height: 100%;
  }

  >.view.-code {
    padding: 0 var(--size-4-2);
  }

  >.view.-nowrap {
    width: auto;
  }

  >.edit {
    @extend %content-common;
    padding: var(--size-4-2);
    overflow: hidden;
    overflow-wrap: break-word;
    resize: none;
    border: none;
    box-shadow: none;
  }

  >.edit.-image,
  >.edit.-code {
    font-family: var(--font-monospace);
    font-size: 13px;
    line-height: 1.5;
    letter-spacing: -0.2px;
  }

  >.edit.-nowrap {
    flex-shrink: 0;
    white-space: pre;
  }
}

.flake-mount-error {
  margin: var(--size-4-2) 0;
  padding: var(--size-4-2);
  text-align: center;
  font-size: var(--font-smaller);
  color: var(--text-muted);
  background-color: var(--background-primary-alt);
}

.flake-edit-tools {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: var(--size-4-1);
  padding: var(--size-4-1);

  background-color: var(--flake-name-bg);
  border-top: var(--border-width) solid var(--flake-border);
}

.flake-edit-row {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  font-size: var(--font-ui-small);

  >.selected {
    color: var(--color-base-00);
    background-color: var(--flake-primary);
  }

  >.expand {
    flex-grow: 1;
  }

  >.gap {
    width: var(--size-4-2);
  }

  >.withlabel {
    display: flex;
    align-items: center;
  }

  >.withlabel.-atleft {
    column-gap: var(--size-4-2);
  }

  >.withlabel.-atright {
    padding-left: var(--size-4-1);
  }

  >.codelang {
    font-family: var(--font-monospace)
  }

  >.codelang::placeholder {
    font-family: var(--font-default)
  }
}

.flake-ratio-value {
  max-width: 120px;

  &:disabled {
    color: var(--text-faint);
  }
}

.flake-menu {
  position: absolute;
  top: var(--size-4-1);
  left: var(--size-4-1);
  right: var(--size-4-1);
  z-index: 20;

  display: none; // flex when hovered
  flex-direction: row;
  column-gap: var(--size-4-1);
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

<style lang="scss">
.flake-content {
  >.view.-image img {
    border-radius: 0;
  }

  >.view.-code pre {
    margin: var(--size-4-1) 0;
    padding: 0;

    background-color: var(--background-primary);
  }

  >.view.-nowrap code {
    white-space: pre;
  }
}
</style>
