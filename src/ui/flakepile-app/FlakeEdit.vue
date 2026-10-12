<script setup lang="ts">
import type { IsDev } from '@/App.vue'
import type { FlakepilePlugin } from '@/custom-view.ts'
import type { Flake } from '@/schemes/v1'
import { vFocus } from '@/utils.ts'
import { ObIcon } from '@/wrappers.ts'
import { useTextareaAutosize } from '@vueuse/core'
import { inject, onMounted, ref, useTemplateRef, watch } from 'vue'
import FlakeFrame from './FlakeFrame.vue'

const props = defineProps<{
  flake: Flake
}>()

const emit = defineEmits<{
  finish: [id: string]
}>()

const plugin = inject('plugin') as FlakepilePlugin
const isDev = inject('isDev') as IsDev

const $textarea = useTemplateRef('$textarea')
const contentEditing = ref<string>('')

onMounted(() => {
  watch(() => props.flake.id, (val, old) => {
    if (val === old) return
    contentEditing.value = props.flake.content
  }, { immediate: true })
})

useTextareaAutosize({
  element: $textarea,
  input: contentEditing,
})

function finishEditing() {
  plugin.updateFlakeContent(props.flake.id, contentEditing.value)
  emit('finish', props.flake.id)
}
</script>

<template>
  <FlakeFrame class="flake-edit">
    <div class="editor-area">
      <textarea
        ref="$textarea"
        v-model="contentEditing"
        v-focus
        class="content-editor"
        placeholder="Note here..."
      ></textarea>
    </div>

    <div class="flake-settings">
      <button v-if="isDev" class="fp-btn-icon">
        <ObIcon name="text-wrap" />
      </button>
      <button v-if="isDev" class="fp-btn-icon">
        <ObIcon name="tags" />
      </button>

      <div class="gap"></div>

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

  > .editor-area {
    display: flex;
  }
}

.content-editor {
  width: 100%;
  background-color: transparent;
  column-gap: var(--size-4-1);

  padding: var(--size-4-2);
  overflow: hidden;
  overflow-wrap: break-word;
  resize: none;
  border: none;
  box-shadow: none;
}

.flake-settings {
  background-color: var(--background-primary-alt);
  border-top: var(--border-width) solid var(--background-modifier-border);

  padding: var(--size-4-1);
  display: flex;

  > .gap {
    flex-grow: 1;
  }
}
</style>
