<script setup lang="ts">
import { computed, inject, nextTick, onUnmounted, ref, useTemplateRef, watch, watchEffect } from 'vue'
import { moment, Notice } from 'obsidian'
import { until, useDebounceFn, useElementSize, useEventListener, useResizeObserver, useTextareaAutosize } from '@vueuse/core'
import type { ImageRawSize, PileActions } from '@/app'
import type { Flake } from '@/data'
import { ObIcon } from '@/components'
import { useCssIf, px, useCssWith, CausedError } from '@/utils'

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

const isView = computed(() => !props.isEdit)

const isEmpty = computed(() => !props.flake.content)
const isText = computed(() => props.flake.type == 'text')
const isCode = computed(() => props.flake.type == 'code')
const isImage = computed(() => props.flake.type == 'image')

const hasImage = computed(() => !isEmpty.value && isImage.value)

const imageRawSize = ref<ImageRawSize | null>(null)
const mountError = ref<string | null>(null)
const actions = inject('actions') as PileActions

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

const nameSize = useElementSize(nameRef)
const contentSize = useElementSize(contentRef)
const footerSize = useElementSize(footerRef)
const scrollBarHeight = ref(0)

useResizeObserver(scrollableRef, (entries) => {
  const entry = entries[0]!
  const el = entry.target as HTMLElement
  scrollBarHeight.value = el.offsetHeight - el.clientHeight
})

const contentHeight = ref(0)

watchEffect(async () => {
  if (isView.value && hasImage.value && imageRawSize.value) {
    if (props.flake.enableRatio) {
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
  return 2 // Border size, not accurate
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

    if (hasImage.value) {
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

const imageOnly = computed(() => {
  return isView.value
    && hasImage.value
    && !mountError.value
    && props.flake.imageOnly
})

const editBegin = () => {
  editName.value = props.flake.name
  editContent.value = props.flake.content
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
const cssEditing = useCssIf(() => props.isEdit, '-editing')
const cssLight = useCssWith(light, (v) => `-light${v}`)

const cssIsCode = useCssIf(isCode, '-code')
const cssIsImage = useCssIf(isImage, '-image')
const cssViewImage = useCssIf(() => isView.value && hasImage.value, '-viewimage')
const cssNoWrap = useCssIf(noWrap, '-nowrap')

const cssTypeIsText = useCssIf(isText, 'selected')
const cssTypeIsCode = useCssIf(isCode, 'selected')
const cssTypeIsImage = useCssIf(isImage, 'selected')
</script>

<template>
  <div ref="el-flake"
    :class="['flake-view', 'fp-flake-theme', cssTheme, cssEditing, cssLight]">
    <div v-if="!imageOnly" ref="el-name">
      <div v-if="isView" class="flake-name -view">
        {{ flake.name }}
      </div>
      <input v-if="isEdit"
        v-model="editName"
        class="flake-name -edit" />
    </div>

    <div ref="el-scrollable" :class="['scrollable', cssViewImage]">
      <div ref="el-content"
        :class="['flake-content', cssViewImage]">
        <div v-if="isView && isEmpty" class="none">
          No Content
        </div>

        <div v-if="isView"
          ref="el-mount"
          :class="['fp-markdown', 'view', cssIsImage, cssIsCode, cssNoWrap]">
        </div>

        <textarea v-if="isEdit"
          ref="el-textarea"
          v-model="editContent"
          :class="['edit', cssIsImage, cssIsCode, cssNoWrap]"
          placeholder="Note here...">
        </textarea>
      </div>
    </div>

    <div v-if="!imageOnly" ref="el-footer">
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

          <button class="fp-btn-icon">
            <ObIcon name="tag" />
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
            <span>Image Only</span>
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

  &>.scrollable.-viewimage {
    @extend .fp-inset;
    position: absolute;

    display: flex;
    overflow: hidden;
    scrollbar-gutter: auto;
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

  &.-viewimage {
    height: 100%;
  }

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

  >.view.-image {
    display: flex;
    padding: 0;

    height: 100%;
  }

  >.view.-image :deep(img) {
    border-radius: 0;
  }

  >.view.-code :deep(pre) {
    margin: 0.5em 0;
    padding: 0;

    background-color: var(--background-primary);
  }

  >.view.-nowrap {
    width: auto;
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
  >.edit.-image,
  >.edit.-code {
    font-family: var(--font-monospace);
    font-size: var(--font-smaller);
    line-height: 1.45;
    letter-spacing: -0.25px;
  }

  >.edit.-nowrap {
    flex-shrink: 0;
    white-space: pre;
  }
}

.flake-edit-tools {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 0.25em;
  padding: 0.25em;

  background-color: var(--flake-name-bg);
  border-top: var(--border-width) solid var(--flake-border);
}

.flake-edit-row {
  display: flex;
  align-items: center;
  column-gap: 0.25em;
  min-height: 2em;

  font-size: var(--font-ui-small);

  >.selected {
    color: var(--color-base-00);
    background-color: var(--flake-primary);
  }

  >.expand {
    flex-grow: 1;
  }

  >.gap {
    width: 0.5em;
  }

  >.withlabel {
    display: flex;
    align-items: center;
  }

  >.withlabel.-atleft {
    column-gap: 0.5em;
  }

  >.withlabel.-atright {
    padding-left: 0.25em;
  }

  >.codelang {
    font-family: var(--font-monospace)
  }

  >.codelang::placeholder {
    font-family: var(--font-default)
  }
}

.flake-ratio-value {
  max-width: 80px;

  &:disabled {
    color: var(--text-faint);
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
