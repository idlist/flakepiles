<script setup lang="ts">
import type { IsDevRef } from '@/App.vue'
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake } from '@/schemes/v1'
import type { FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/use'
import { ObIcon } from '@/wrappers'
import { useDebounceFn, useFocus, useResizeObserver } from '@vueuse/core'
import { computed, inject, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import FlakeFrame from './FlakeFrame.vue'

const props = defineProps<{
  flake: Flake
  innerHeight: number
}>()

const emit = defineEmits<{
  finish: [id: string]
  updateHeight: [height: number]
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const isDev = inject('isDev') as IsDevRef
const meta = inject('meta') as FlakepileMetaRef

const $textarea = useTemplateRef('$textarea')
const $settings = useTemplateRef('$settings')
const { focused } = useFocus($textarea)

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

const reportHeightDebounced = useDebounceFn(updateHeight, 0)
useResizeObserver([$textarea, $settings], reportHeightDebounced)

onMounted(() => {
  watch(
    () => props.flake.id,
    async (val, old) => {
      if (val === old) return

      lastHeight.value = 0
      contentEditing.value = props.flake.content
      focused.value = true

      await nextTick()
      updateHeight()
    },
    { immediate: true },
  )
})

function selectAll() {
  if (!$textarea.value) return

  $textarea.value.focus()
  $textarea.value.select()
}

function finishEditing() {
  plugin.updateFlakeContent(props.flake.id, contentEditing.value)
  emit('finish', props.flake.id)
}

const shouldScrollY = computed(() => {
  if (meta.value.enableMaxHeight) {
    return lastHeight.value > meta.value.maxHeight + 2
  } else {
    return lastHeight.value > props.innerHeight + 2
  }
})

const useScrollY = useCssIf(shouldScrollY, '-scrolly')
</script>

<template>
  <FlakeFrame class="flake-edit">
    <div :class="['editor-area', useScrollY]">
      <textarea
        ref="$textarea"
        v-model="contentEditing"
        v-focus
        class="content-editor"
        placeholder="Note here..."
      ></textarea>
    </div>

    <div ref="$settings" class="flake-settings">
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
  </FlakeFrame>
</template>

<style scoped lang="scss">
.flake-edit {
  display: grid;
  grid-template-rows: auto max-content;
  z-index: 2;

  > .editor-area {
    overflow: hidden;
  }

  > .editor-area.-scrolly {
    overflow-y: scroll;
  }
}

.content-editor {
  display: block;
  width: 100%;
  background-color: transparent;

  padding: var(--size-4-2);
  overflow: hidden;
  overflow-wrap: break-word;
  resize: none;
  border: none;
  box-shadow: none;
  field-sizing: content;

  font-family: var(--font-text-theme);
  font-size: var(--font-text-size);
  line-height: 1.5;
}

.flake-settings {
  display: flex;
  column-gap: var(--size-4-1);

  padding: var(--size-4-1);

  background-color: var(--background-primary-alt);
  border-top: var(--border-width) solid var(--background-modifier-border);

  > .gap {
    flex-grow: 1;
  }
}
</style>
