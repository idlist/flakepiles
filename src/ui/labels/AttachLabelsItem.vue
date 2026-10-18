<script setup lang="ts">
import type { FlakeLabelColor } from '@/schemes/common'
import LabelsBadge from './LabelsBadge.vue'

withDefaults(
  defineProps<{
    name: string
    color?: FlakeLabelColor
    checked?: boolean
  }>(),
  {
    color: 'none',
    checked: false,
  },
)

const emit = defineEmits<{
  update: [checked: boolean]
}>()
</script>

<template>
  <div class="attach-labels-item" @click="emit('update', !checked)">
    <input type="checkbox" :checked="checked">
    <LabelsBadge :name="name" :color="color" />
  </div>
</template>

<style scoped lang="scss">
.attach-labels-item {
  display: flex;
  align-items: center;

  min-width: 0;
}
</style>
