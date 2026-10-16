<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import LabelsCore from '@/ui/labels/LabelsCore.vue'
import { App, Modal } from 'obsidian'
import { inject, onBeforeUnmount, shallowRef } from 'vue'

const plugin = inject('plugin') as FlakepilePluginRef

const $anchor = shallowRef<HTMLElement | null>(null)
let modal: Modal | null = null

class LabelsModal extends Modal {
  constructor(app: App) {
    super(app)
  }

  onOpen() {
    this.setTitle('Manage Labels')
    $anchor.value = this.contentEl
  }

  onClose() {
    $anchor.value = null
    this.contentEl.empty()
  }
}

function openModal() {
  modal = new LabelsModal(plugin.getApp())
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
    <LabelsCore />
  </Teleport>
</template>
