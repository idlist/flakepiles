<script setup lang="ts">
import { SearchComponent } from 'obsidian'
import { onMounted, useTemplateRef, watch } from 'vue'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  placeholder?: string
}>()

const $anchor = useTemplateRef('$anchor')
let search: SearchComponent | null = null

onMounted(() => {
  if (!$anchor.value) return

  search = new SearchComponent($anchor.value)
    .setPlaceholder(props.placeholder ?? 'Search...')
    .setValue(model.value)
    .onChange((value: string) => {
      model.value = value
    })
})

watch(() => model.value, (next) => {
  if (search && search.getValue() !== next) {
    search.setValue(next)
  }
})
</script>

<template>
  <div ref="$anchor" class="ob-search-anchor" @keydown.stop></div>
</template>

<style scoped>
.ob-search-anchor :deep(.search-input-container) {
  width: 100%;
  display: flex;
}
</style>
