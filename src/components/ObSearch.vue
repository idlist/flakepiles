<script setup lang="ts">
import { onMounted, watch, useTemplateRef } from 'vue'
import { SearchComponent } from 'obsidian'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  placeholder?: string;
}>()

const searchRef = useTemplateRef('el-search')
let component: SearchComponent | null = null

onMounted(() => {
  if (!searchRef.value) return

  component = new SearchComponent(searchRef.value)
    .setPlaceholder(props.placeholder ?? 'Search...')
    .setValue(model.value)
    .onChange((value: string) => {
      model.value = value
    })
})

watch(() => model.value, (next) => {
  if (component && component.getValue() !== next) {
    component.setValue(next)
  }
})
</script>

<template>
  <div ref="el-search" class="ob-search-wrapper" @keydown.stop></div>
</template>

<style>
.ob-search-wrapper>.search-input-container {
  width: 100%;
  display: flex;
}
</style>
