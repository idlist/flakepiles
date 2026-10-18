<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakeLabel } from '@/schemes/common'
import { ObIcon } from '@/wrappers'
import { useFocus } from '@vueuse/core'
import { inject, onMounted, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  label: FlakeLabel
}>()

const emit = defineEmits<{
  finish: []
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const nameUnderEdit = ref('')
const $editInput = useTemplateRef('$editInput')
const { focused } = useFocus($editInput)

onMounted(() => {
  nameUnderEdit.value = props.label.name
  focused.value = true
})

function tryFinishEditing() {
  const success = plugin.updateLabelProps(props.label.id, 'name', nameUnderEdit.value)
  if (success) {
    emit('finish')
  }
}

function tryFinishEditingOnEnter(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    tryFinishEditing()
  }
}
</script>

<template>
  <div class="fp-labels-item labels-item-edit">
    <input
      type="text"
      v-model="nameUnderEdit"
      class="expand"
      placeholder="Edit label..."
      ref="$editInput"
      @keypress="tryFinishEditingOnEnter"
    />

    <button class="fp-btn-icon" @click="tryFinishEditing">
      <ObIcon name="check" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.labels-item-edit {
  padding-left: var(--size-2-1);
}
</style>
