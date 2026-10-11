<script setup lang="ts">
import type { FlakepileRef, LoadingResult } from '@/custom-view.ts'
import { inject, provide, ref } from 'vue'

import PileFailed from './PileFailed.vue'
import PileLoading from './PileLoading.vue'
import PileParsed from './PileParsed.vue'

defineProps<{ pile: FlakepileRef }>()
const parsing = inject('parsing') as LoadingResult

const isDev = ref(false)
provide('isDev', isDev)
</script>

<template>
  <PileLoading v-if="parsing.state == 'loading'" />

  <PileFailed v-else-if="parsing.state == 'failed'" />

  <PileParsed v-else :pile="pile" />
</template>
