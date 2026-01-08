<script setup lang="ts">
import ObIcon from '@/components/ObIcon.vue'

const model = defineModel<boolean>()
</script>

<template>
  <button v-if="!model"
    class="fp-btn-icon"
    @click="model = true">
    <ObIcon name="square-menu" />
  </button>
  <button v-else
    class="fp-btn-icon"
    @click="model = false">
    <ObIcon name="cross" />
  </button>
</template>
