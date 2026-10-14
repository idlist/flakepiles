<script setup lang="ts">
import type { IsDevRef } from '@/App.vue'
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake } from '@/schemes/v1'
import type { FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/use'
import { ObIcon } from '@/wrappers'
import { useFocus, useResizeObserver, useThrottleFn } from '@vueuse/core'
import { computed, inject, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
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
const isDev = inject('isDev') as IsDevRef
const meta = inject('meta') as FlakepileMetaRef

const $textarea = useTemplateRef('$textarea')
const $settings = useTemplateRef('$settings')
const { focused } = useFocus($textarea)

/* Dynamic Sizing */

const contentEditing = ref<string>('')
const lastHeight = ref<number>(0)

function updateHeight() {
  const heightTextarea = $textarea.value?.scrollHeight ?? 0
  const heightSettings = $settings.value?.scrollHeight ?? 0
  const height = heightTextarea + heightSettings

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

      contentEditing.value = props.flake.content
      lastHeight.value = 0
      tryCancelEditing.value = false
      focused.value = true

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

const tryCancelEditing = ref(false)

function cancelEditing() {
  emit('cancel')
}

function finishEditing() {
  plugin.updateFlakeContent(props.flake.id, contentEditing.value)
  emit('finish', props.flake.id)
}

/* Flake Scrollable State */

const shouldScrollY = computed(() => {
  if (meta.value.enableMaxHeight) {
    return lastHeight.value > meta.value.maxHeight + 2
  } else {
    return lastHeight.value > props.innerHeight + 2
  }
})

const ifScrollY = useCssIf(shouldScrollY, '-scrolly')
</script>

<template>
  <FlakeFrame class="flake-edit" :id="flake.id">
    <div :class="['editor-area', ifScrollY]">
      <textarea
        ref="$textarea"
        v-model="contentEditing"
        class="content-editor"
        placeholder="Note here..."
      ></textarea>
    </div>

    <div ref="$settings" class="flake-settings">
      <button
        v-if="!tryCancelEditing"
        class="fp-btn-icon fp-danger"
        @click="tryCancelEditing = true"
      >
        <ObIcon name="pencil-off" />
      </button>
      <button v-if="isDev" class="fp-btn-icon">
        <ObIcon name="text-wrap" />
      </button>
      <button v-if="isDev" class="fp-btn-icon">
        <ObIcon name="tags" />
      </button>

      <div class="gap"></div>

      <button class="fp-btn-icon" @click="selectAll">
        <ObIcon name="scan" />
      </button>
      <button class="fp-btn-icon" @click="finishEditing">
        <ObIcon name="check" />
      </button>
    </div>

    <div
      v-if="tryCancelEditing"
      class="flake-edit-cancel-fuse"
      @click="tryCancelEditing = false"
    >
      <button
        class="fp-btn-icon fp-warning flake-edit-cancel"
        @click="cancelEditing"
      >
        <ObIcon name="message-circle-question-mark" />
      </button>
    </div>
  </FlakeFrame>
</template>

<style scoped lang="scss">
.flake-edit {
  display: grid;
  grid-template-rows: auto max-content;
  z-index: 2;

  > .editor-area {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable both-edges;
  }

  > .editor-area.-scrolly {
    overflow-y: scroll;
  }
}

.content-editor {
  display: block;
  width: 100%;
  background-color: transparent;

  padding: 0.5em 0;
  overflow: hidden;
  overflow-wrap: break-word;
  resize: none;
  border: none;
  box-shadow: none;
  field-sizing: content;

  font-size: var(--flakepile-font-size, var(--font-text-size));
  font-family: var(--font-text);
  line-height: var(--line-height-normal);
}

.flake-settings {
  display: flex;
  column-gap: var(--size-4-1);
  padding: var(--size-4-1);

  > .gap {
    flex-grow: 1;
  }
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
}
</style>
