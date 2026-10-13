<script setup lang="ts">
import { px } from '@/utils'
import { setIcon } from 'obsidian'
import { computed, onMounted, type StyleValue, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  name: string
  size?: number
  color?: string
}>()

const $icon = useTemplateRef('$icon')

onMounted(() => {
  setIcon($icon.value!, props.name)
})

const styles = computed(() => {
  const decls: StyleValue = {}

  if (props.color) {
    decls.color = props.color
  }
  if (props.size) {
    decls.width = px(props.size)
    decls.height = px(props.size)
  }

  return decls
})

watch(() => props.name, () => {
  setIcon($icon.value!, props.name)
})
</script>

<template>
  <div ref="$icon" class="ob-icon-anchor" :style="styles"></div>
</template>

<style scoped>
.ob-icon-anchor {
  display: flex;
}
</style>
