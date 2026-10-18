<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import AttachLabelsCore, { type AttachLabelsProps } from '@/ui/labels/AttachLabelsCore.vue'
import { App, Modal } from 'obsidian'
import { inject, onBeforeUnmount, shallowRef } from 'vue'

defineProps<AttachLabelsProps>()

const plugin = inject('plugin') as FlakepilePluginRef

const $anchor = shallowRef<HTMLElement | null>(null)
let modal: Modal | null = null

class SelectLabelModal extends Modal {
  constructor(app: App) {
    super(app)
  }

  onOpen() {
    this.setTitle('Attach Labels')
    $anchor.value = this.contentEl
  }

  onClose() {
    $anchor.value = null
    this.contentEl.empty()
  }
}

function openModal() {
  modal = new SelectLabelModal(plugin.getApp())
  modal.open()
}

onBeforeUnmount(() => {
  modal?.close()
  modal = null
})

defineExpose({
  open: openModal,
})
</script>

<template>
  <Teleport v-if="$anchor" :to="$anchor">
    <AttachLabelsCore :flake="flake" />
  </Teleport>
</template>
