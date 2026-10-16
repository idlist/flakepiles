<script setup lang="ts">
import type { FlakeLabel, FlakeLabelColor } from '@/schemes/common'
import LabelsColorPicker from './LabelsColorPicker.vue'
import type { LabelEditState } from './LabelsCore.vue'
import LabelsItemEdit from './LabelsItemEdit.vue'
import LabelsItemView from './LabelsItemView.vue'

const props = defineProps<{
  label: FlakeLabel
  more: boolean
  state: LabelEditState
}>()
</script>

<template>
  <div v-if="!more" class="labels-item">
    <div class="name" :title="label.name">
      {{ label.name }}
    </div>

    <div class="expand"></div>
  </div>

  <div v-else-if="state === 'idle' || state === 'color'">
    <LabelsItemView :label="label" />

    <LabelsColorPicker
      v-if="state === 'color'"
      :label="label"
    />
  </div>

  <LabelsItemEdit
    v-else-if="state === 'name'"
    :label="label"
  />
</template>

<style scoped lang="scss">
.labels-item {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  min-width: 0;

  &.-colorpicker {
    margin-top: var(--size-4-1);
    padding-top: var(--size-4-1);
    padding-bottom: var(--size-4-1);
    border-top: var(--fp-border);
    border-bottom: var(--fp-border);
    background-color: var(--background-primary-alt);
  }

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

  > .divider {
    border-right: var(--fp-border);
    height: var(--size-4-6);
  }
}
</style>
