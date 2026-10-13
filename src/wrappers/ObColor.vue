<script setup lang="ts">
import { ColorComponent } from 'obsidian'
import { onMounted, useTemplateRef, watch } from 'vue'

const model = defineModel<string>({ required: true })

const $anchor = useTemplateRef('$anchor')
let color: ColorComponent | null = null

onMounted(() => {
  color = new ColorComponent($anchor.value!)
    .setValue(model.value)
    .onChange((value) => {
      model.value = value
    })
})

watch(() => model.value, (value) => {
  if (color && value != color.getValue()) {
    color.setValue(value)
  }
})
</script>

<template>
  <div ref="$anchor" class="ob-color-anchor"></div>
</template>

<style scoped>
.ob-color-anchor {
  display: inline-flex;
  vertical-align: middle;
}
</style>
