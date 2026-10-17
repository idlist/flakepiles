<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakeLabel } from '@/schemes/common'
import { ObIcon } from '@/wrappers'
import { inject, onMounted, ref } from 'vue'

const props = defineProps<{
  label: FlakeLabel
}>()

const emit = defineEmits<{
  finish: []
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const nameUnderEdit = ref('')

onMounted(() => {
  nameUnderEdit.value = props.label.name
})

function finishEditing() {
  const success = plugin.updateLabelProps(props.label.id, 'name', nameUnderEdit.value)
  if (success) {
    emit('finish')
  }
}
</script>

<template>
  <div class="fp-labels-item">
    <input
      type="text"
      v-model="nameUnderEdit"
      class="expand"
      placeholder="Edit label..."
    />

    <button class="fp-btn-icon" @click="finishEditing">
      <ObIcon name="check" />
    </button>
  </div>
</template>
