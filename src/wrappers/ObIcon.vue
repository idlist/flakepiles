<script setup lang="ts">
import { setIcon } from 'obsidian'
import { computed, onMounted, type StyleValue, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  name: string
  cssColor?: string
}>()

const iconRef = useTemplateRef('el-icon')

onMounted(() => {
  setIcon(iconRef.value!, props.name)
})

const styles = computed(() => {
  const decls: StyleValue = {}
  if (props.cssColor) decls.color = props.cssColor
  return decls
})

watch(() => props.name, () => {
  setIcon(iconRef.value!, props.name)
})
</script>

<template>
  <div ref="el-icon" class="ob-icon-wrapper" :style="styles"></div>
</template>

<style scoped>
.ob-icon-wrapper {
  display: flex;
}
</style>
