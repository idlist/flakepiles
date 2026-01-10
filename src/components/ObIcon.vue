<script setup lang="ts">
import { computed, onMounted, useTemplateRef, type StyleValue } from 'vue'
import { setIcon } from 'obsidian'

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
</script>

<template>
  <div ref="el-icon" class="ob-icon-wrapper" :style="styles"></div>
</template>

<style scoped>
.ob-icon-wrapper {
  display: flex;
}
</style>
