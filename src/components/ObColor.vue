<script setup lang="ts">
import { onMounted, watch, useTemplateRef } from 'vue'
import { ColorComponent } from 'obsidian'

const model = defineModel<string>({ required: true })

const colorRef = useTemplateRef('el-color')
let component: ColorComponent | null = null

onMounted(() => {
  if (colorRef.value) {
    component = new ColorComponent(colorRef.value)
      .setValue(model.value)
      .onChange((value) => {
        model.value = value
      })
  }
})

watch(() => model.value, (value) => {
  if (component && value != component.getValue()) {
    component.setValue(value)
  }
})
</script>

<template>
  <div ref="el-color" class="ob-color-wrapper"></div>
</template>

<style scoped>
.obs-color-wrapper {
  display: inline-flex;
  vertical-align: middle;
}
</style>
