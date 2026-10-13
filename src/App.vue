<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view.ts'
import type { Flakepile } from '@/schemes/v1.ts'
import { computed, inject, provide, type Ref, ref } from 'vue'
import FlakepileApp from './ui/FlakepileApp.vue'
import FlakepileInvalid from './ui/FlakepileInvalid.vue'
import FlakepileLoading from './ui/FlakepileLoading.vue'

const props = defineProps<{ flakepile: Ref<Flakepile | null> }>()
const plugin = inject('plugin') as FlakepilePluginRef

const isDev = ref(false)

provide('isDev', isDev)
export type IsDevRef = Ref<boolean>

const loadingState = computed(() => plugin.meta.loadingState)
const pile = computed(() => props.flakepile.value)
</script>

<template>
  <FlakepileLoading v-if="loadingState === 'loading'" />
  <FlakepileInvalid v-else-if="loadingState === 'invalid'" />
  <FlakepileApp v-else-if="pile != null" :pile="pile" />
</template>
