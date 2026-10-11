<script setup lang="ts">
import type { Parsing, PileRef } from '@/view'
import { inject, provide, ref } from 'vue'

import PileFailed from './PileFailed.vue'
import PileLoading from './PileLoading.vue'
import PileParsed from './PileParsed.vue'

defineProps<{ pile: PileRef }>()
const parsing = inject('parsing') as Parsing

const isDev = ref(false)
provide('isDev', isDev)
</script>

<template>
  <PileLoading v-if="parsing.state == 'loading'" />

  <PileFailed v-else-if="parsing.state == 'failed'" />

  <PileParsed v-else :pile="pile" />
</template>
