<script setup lang="ts">
import { onMounted, watch, useTemplateRef } from 'vue'
import { TextComponent } from 'obsidian'

const props = withDefaults(defineProps<{
  disabled?: boolean
  placeholder?: string
}>(), {
  placeholder: '',
})

const model = defineModel<string>({ default: '' })

const container = useTemplateRef('el-text')
let component: TextComponent | null = null

onMounted(() => {
  if (container.value) {
    component = new TextComponent(container.value)
      .setValue(model.value)
      .setPlaceholder(props.placeholder)
      .setDisabled(props.disabled)

    component.onChange((value) => {
      model.value = value
    })
  }
})

watch(() => model.value, (next) => {
  if (component && component.getValue() !== next) {
    component.setValue(next)
  }
})

watch(() => props.disabled, (newVal) => {
  component?.setDisabled(newVal)
})
</script>

<template>
  <div ref="el-text" class="ob-text-wrapper"></div>
</template>

<style scoped>
.ob-text-wrapper {
  display: flex;
}

.ob-text-wrapper :deep(input) {
  width: 100%;
}
</style>
