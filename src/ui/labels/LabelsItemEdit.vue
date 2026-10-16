<script setup lang="ts">
import type { FlakeLabel } from '@/schemes/common'
import { ObIcon } from '@/wrappers'
import { ref } from 'vue'

defineProps<{
  label: FlakeLabel
}>()

const emit = defineEmits<{
  (e: 'finish'): void
}>()

// TODO: Replace the placeholder ref with the shared editing state once it is lifted upward.
const editLabelName = ref('')
</script>

<template>
  <div class="label-item">
    <input
      v-model="editLabelName"
      type="text"
      class="expand"
      placeholder="Edit label..."
    />

    <button
      class="fp-btn-icon"
      @click="emit('finish')"
    >
      <ObIcon name="check" />
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
}
</style>
