<script setup lang="ts">
import { inject, provide, ref } from 'vue'
import type { Parsing, PileRef } from '@/view'

import PileLoading from './PileLoading.vue'
import PileFailed from './PileFailed.vue'
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
