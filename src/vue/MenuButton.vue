<script setup lang="ts">
import ObIcon from '@/wrappers/ObIcon.vue'

defineProps<{
  icon: string
  label: string
}>()
</script>

<template>
  <button class="button">
    <ObIcon :name="icon" />
    <span class="label">{{ label }}</span>
  </button>
</template>
