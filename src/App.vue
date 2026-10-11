<script setup lang="ts">
import type { FlakepilePlugin } from '@/custom-view.ts'
import { computed, inject, provide, ref } from 'vue'
import FlakepileApp from './ui/FlakepileApp.vue'
import FlakepileInvalid from './ui/FlakepileInvalid.vue'
import FlakepileLoading from './ui/FlakepileLoading.vue'

const plugin = inject('plugin') as FlakepilePlugin

const isDev = ref(false)
provide('isDev', isDev)

const loadingState = computed(() => plugin.meta.loadingState)
</script>

<template>
  <FlakepileLoading v-if="loadingState === 'loading'" />
  <FlakepileInvalid v-else-if="loadingState === 'invalid'" />
  <FlakepileApp v-else />
</template>
