<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { setIcon } from 'obsidian'

const props = defineProps<{
  name: string
}>()

const elIcon = useTemplateRef('el-icon')

onMounted(() => {
  setIcon(elIcon.value!, props.name)
})
</script>

<template>
  <div ref="el-icon" class="icon-wrapper"></div>
</template>

<style lang="scss" scoped>
.icon-wrapper {
  display: flex;
}
</style>
