<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake, FlakeLabelColor } from '@/schemes/common'
import type { FlakepileLabelsRef, FlakepileMetaRef, FloatingAreaRect } from '@/ui/FlakepileApp.vue'
import { useCssIf, useFlakeMetaBinder } from '@/use'
import { getScrollbarHeight, idFloatingArea, px } from '@/utils'
import { ObIcon } from '@/wrappers'
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/vue'
import { useFocus, useResizeObserver, useThrottleFn } from '@vueuse/core'
import { Platform } from 'obsidian'
import { computed, inject, nextTick, onMounted, ref, useTemplateRef, watch, watchEffect } from 'vue'
import LabelsBadge from '../labels/LabelsBadge.vue'
import AttachLabelsMobileModal from './AttachLabelsMobileModal.vue'
import AttachLabelsPanel from './AttachLabelsPanel.vue'
import FlakeFrame from './FlakeFrame.vue'

const props = defineProps<{
  flake: Flake
  innerHeight: number
}>()

const emit = defineEmits<{
  updateHeight: [height: number]
  finish: [id: string]
  cancel: []
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const meta = inject('meta') as FlakepileMetaRef
const labels = inject('labels') as FlakepileLabelsRef
const floatingAreaRect = inject('floatingAreaRect') as FloatingAreaRect

const $textarea = useTemplateRef('$textarea')
const $settings = useTemplateRef('$settings')
const { focused } = useFocus($textarea)

const bind = useFlakeMetaBinder(plugin)
const textWrap = bind(props.flake.meta, props.flake.id, 'textWrap')

const showAttachLabels = ref(false)

/* Dynamic Sizing */

const contentUnderEdit = ref<string>('')
const lastHeight = ref<number>(0)

function updateHeight() {
  const heightTextarea = $textarea.value?.scrollHeight ?? 0
  const heightSettings = $settings.value?.scrollHeight ?? 0
  const heightScrollbar = getScrollbarHeight($textarea.value)
  const height = heightTextarea + heightSettings + heightScrollbar

  const diff = height - lastHeight.value
  if (Math.abs(diff) < 2) return

  lastHeight.value = height
  emit('updateHeight', height)
}

const reportHeightThrottled = useThrottleFn(updateHeight, 1, true)
useResizeObserver([$textarea, $settings], reportHeightThrottled)

onMounted(() => {
  watch(
    () => props.flake.id,
    async (val, old) => {
      if (val === old) return

      contentUnderEdit.value = props.flake.content
      lastHeight.value = 0
      tryCancelling.value = false
      focused.value = true
      showAttachLabels.value = false

      await nextTick()
      updateHeight()
    },
    { immediate: true },
  )
})

/* Flake Actions */

function selectAll() {
  if (!$textarea.value) return

  $textarea.value.focus()
  $textarea.value.select()
}

const tryCancelling = ref(false)

function cancelEditing() {
  emit('cancel')
}

function finishEditing() {
  plugin.updateFlakeContent(props.flake.id, contentUnderEdit.value)
  emit('finish', props.flake.id)
}

/* Flake Attach Labels Panel */

const $attachLabelsButton = useTemplateRef('$attachLabelsButton')
const $attachLabelsPanel = useTemplateRef<InstanceType<typeof AttachLabelsPanel>>('$attachLabelsPanel')

const { floatingStyles: attachLabelsPanelStyle } = useFloating(
  $attachLabelsButton,
  $attachLabelsPanel,
  {
    middleware: [
      offset(4),
      shift(),
      flip(),
      size({
        boundary: floatingAreaRect.value,
        padding: 8,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = px(Math.max(0, availableHeight))
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  },
)

const $attachLabelsMobileModal = useTemplateRef('$attachLabelsMobileModal')

function toggleAttachLabels() {
  if (Platform.isDesktop || Platform.isTablet) {
    showAttachLabels.value = !showAttachLabels.value
  }
  if (Platform.isPhone) {
    $attachLabelsMobileModal.value?.open()
  }
}

/* Flake Label Count & Flake Color */

const showLabelCount = ref<boolean>(false)
const labelCountDisplay = ref<string>('')
const flakeColor = ref<FlakeLabelColor>('none')

watchEffect(() => {
  const total = props.flake.labels.length
  showLabelCount.value = total !== 0
  if (!showLabelCount.value) {
    flakeColor.value = 'none'
    return
  }

  const ids = new Set(props.flake.labels)
  let collapsed = 0
  let color: FlakeLabelColor | null = null

  for (const label of labels.value) {
    if (!ids.has(label.id)) {
      continue
    } else if (label.collapsed) {
      collapsed++
    } else {
      color ??= label.color
    }
  }

  flakeColor.value = color ?? 'none'
  const shown = total - collapsed

  let display = ''
  if (shown !== 0) display += `${shown}`
  if (collapsed !== 0) display += `+${collapsed}`

  labelCountDisplay.value = display
})

/* Flake Scrollable State */

const shouldScrollY = computed(() => {
  if (meta.value.enableMaxHeight) {
    return lastHeight.value > meta.value.maxHeight + 2
  } else {
    return lastHeight.value > props.innerHeight + 2
  }
})

const ifScrollY = useCssIf(shouldScrollY, '-scrolly')
const ifNoWrap = useCssIf(() => !textWrap.value, '-nowrap')
const ifTextWrap = useCssIf(textWrap, 'fp-invert')
const ifAttachingLabels = useCssIf(showAttachLabels, 'fp-invert')
</script>

<template>
  <FlakeFrame class="flake-edit" :id="flake.id" :color="flakeColor">
    <div :class="['scrollable', ifScrollY]">
      <textarea
        ref="$textarea"
        v-model="contentUnderEdit"
        :class="['content-editor', ifNoWrap]"
        placeholder="Note here..."
      ></textarea>
    </div>

    <div ref="$settings" class="flake-settings">
      <div class="flake-settings-left">
        <button
          class="fp-btn-icon fp-danger"
          @click="tryCancelling = true"
        >
          <ObIcon name="pencil-off" />
        </button>
        <button
          :class="['fp-btn-icon', ifTextWrap]"
          @click="textWrap = !textWrap"
        >
          <ObIcon name="text-wrap" />
        </button>
        <button
          ref="$attachLabelsButton"
          :class="['fp-btn-icon', ifAttachingLabels]"
          @click="toggleAttachLabels"
        >
          <ObIcon name="tags" />
        </button>

        <LabelsBadge
          v-if="showLabelCount"
          :name="labelCountDisplay ?? ''"
          color="accent"
        />
      </div>

      <div class="flake-settings-right">
        <button class="fp-btn-icon" @click="selectAll">
          <ObIcon name="scan" />
        </button>
        <button class="fp-btn-icon" @click="finishEditing">
          <ObIcon name="check" />
        </button>
      </div>
    </div>

    <div
      v-if="tryCancelling"
      class="flake-edit-cancel-fuse"
      @click="tryCancelling = false"
    >
      <button
        class="fp-btn-icon fp-warning flake-edit-cancel"
        @click="cancelEditing"
      >
        <ObIcon name="message-circle-question-mark" />
      </button>
    </div>

    <Teleport defer :to="`#${idFloatingArea}`">
      <AttachLabelsPanel
        v-if="showAttachLabels"
        ref="$attachLabelsPanel"
        :style="attachLabelsPanelStyle"
        :flake="flake"
      />
    </Teleport>

    <AttachLabelsMobileModal
      ref="$attachLabelsMobileModal"
      :flake="flake"
    />
  </FlakeFrame>
</template>

<style scoped lang="scss">
.flake-edit {
  display: grid;
  grid-template-rows: auto max-content;
  z-index: 2;

  > .scrollable {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable both-edges;
  }

  > .scrollable.-scrolly {
    overflow-y: scroll;
  }
}

.content-editor {
  display: block;
  width: 100%;
  background-color: transparent;

  overflow-x: auto;
  overflow-y: hidden;
  overflow-wrap: break-word;
  resize: none;
  border: none;
  box-shadow: none;
  field-sizing: content;

  font-size: var(--fp-font-size, var(--font-text-size));
  font-family: var(--font-text);
  line-height: var(--line-height-normal);
  padding: calc(0.5em + var(--size-2-1)) 0;

  .is-mobile & {
    padding: calc(0.375em + var(--size-4-1)) var(--size-4-3);
  }

  &.-nowrap {
    white-space: pre;
  }
}

.flake-settings {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--size-4-2);
  row-gap: var(--size-4-1);

  padding: var(--size-4-1);

  .is-mobile & {
    padding: var(--size-4-2);
  }
}

%flake-settings-row {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);
}

.flake-settings-left {
  @extend %flake-settings-row;
}

.flake-settings-right {
  @extend %flake-settings-row;
  flex-grow: 1;
  justify-content: end;
}

.flake-edit-cancel-fuse {
  position: absolute;
  inset: 0;
  z-index: 4;

  background-color: color-mix(in oklch, var(--color-base-00) 75%, transparent);
}

.flake-edit-cancel {
  position: absolute;
  bottom: var(--size-4-1);
  left: var(--size-4-1);

  .is-mobile & {
    bottom: var(--size-4-2);
    left: var(--size-4-2);
  }
}
</style>
