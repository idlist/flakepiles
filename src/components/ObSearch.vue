<script setup lang="ts">
import { onMounted, watch, useTemplateRef } from 'vue'
import { SearchComponent } from 'obsidian'

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>()

const searchRef = useTemplateRef('el-search')
let component: SearchComponent | null = null

onMounted(() => {
  if (!searchRef.value) return

  component = new SearchComponent(searchRef.value)
    .setPlaceholder(props.placeholder ?? 'Search...')
    .setValue(props.modelValue)
    .onChange((value: string) => {
      emit('update:modelValue', value)
    })
})

watch(() => props.modelValue, (next) => {
  if (component && component.getValue() !== next) {
    component.setValue(next)
  }
})
</script>

<template>
  <div ref="el-search" class="ob-search-wrapper" @keydown.stop></div>
</template>

<style scoped>
.ob-search-wrapper :deep(.search-input-container) {
  width: 100%;
  display: flex;
}
</style>
