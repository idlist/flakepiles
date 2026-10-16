<script setup lang="ts">
import type { FlakepileLabelsRef } from '@/ui/FlakepileApp.vue'
import { inject, onUnmounted, reactive, ref } from 'vue'
import LabelsItem from './LabelsItem.vue'
import LabelsTitle from './LabelsTitle.vue'

const labels = inject('labels') as FlakepileLabelsRef

export type LabelEditState = 'idle' | 'name' | 'color'

const more = ref(false)
const editType = ref<LabelEditState>('idle')
const labelUnderEdit = ref<string | null>(null)

onUnmounted(() => {
  more.value = false
})
</script>

<template>
  <div class="labels-core">
    <LabelsTitle v-model:more="more" />

    <div class="labels-list">
      <LabelsItem
        v-for="label of labels"
        :key="label.id"
        :label="label"
        :more="more"
        :state="label.id === labelUnderEdit ? editType : 'idle'"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.labels-core {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content 1fr;
  pointer-events: visible;
}
</style>
