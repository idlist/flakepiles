<script setup lang="ts">
import AttachLabelsCore, { type AttachLabelsProps } from '@/ui/labels/AttachLabelsCore.vue'

defineProps<AttachLabelsProps>()
const labelIds = defineModel<string[]>('labelIds', { required: true })
</script>

<template>
  <div class="menu select-label-panel">
    <AttachLabelsCore :id="id" v-model:label-ids="labelIds" />
  </div>
</template>

<style scoped lang="scss">
.select-label-panel {
  padding: var(--size-4-2) 0 var(--size-4-2) var(--scrollbar-width);
  font-size: var(--font-ui-small);
  max-width: 240px;

  pointer-events: visible;

  .is-tablet & {
    padding-left: var(--size-4-3);
    padding-right: var(--size-4-3);
  }
}
</style>
