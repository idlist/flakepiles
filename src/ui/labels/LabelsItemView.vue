<script setup lang="ts">
import type { FlakeLabel } from '@/schemes/common'
import { ObIcon } from '@/wrappers'

defineProps<{
  label: FlakeLabel
}>()

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'editNameBegin', id: string): void
  (e: 'editColorBegin', id: string): void
  (e: 'editColorFinish'): void
  (e: 'setListed', id: string, value: boolean): void
}>()
</script>

<template>
  <div class="label-item">
    <button
      class="fp-btn-icon danger"
      @click="emit('remove', label.id)"
    >
      <ObIcon name="trash-2" />
    </button>

    <div class="name" :title="label.name">
      {{ label.name }}
    </div>

    <div class="expand"></div>

    <button
      class="fp-btn-icon"
      @click="emit('editNameBegin', label.id)"
    >
      <ObIcon name="square-pen" />
    </button>

    <button
      v-if="editing.state != 'color' || editing.target != label.id"
      class="fp-btn-icon"
      @click="emit('editColorBegin', label.id)"
    >
      <ObIcon name="palette" />
    </button>
    <button
      v-else
      class="fp-btn-icon invert"
      @click="emit('editColorFinish')"
    >
      <ObIcon name="palette" />
    </button>

    <button
      v-if="label.collapsed"
      class="fp-btn-icon"
      @click="emit('setListed', label.id, false)"
    >
      <ObIcon name="text-align-start" />
    </button>
    <button
      v-else
      class="fp-btn-icon invert"
      @click="emit('setListed', label.id, true)"
    >
      <ObIcon name="circle-off" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.label-item {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  min-width: 0;

  > .expand {
    flex-grow: 1;
  }

  > .name {
    color: #ffffff;
    background-color: #333333;

    font-size: var(--font-ui-smaller);
    padding: var(--size-2-1) var(--size-2-3);
    border-radius: var(--size-4-4);

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
