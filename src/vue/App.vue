<script setup lang="ts">
import { inject, provide, ref } from 'vue'
import type { ParsingStateRef, PileRef } from '@/view'

import PileLoad from './PileLoad.vue'
import PileFailed from './PileFailed.vue'
import PileParsed from './PileParsed.vue'

defineProps<{ pile: PileRef }>()
const parsing = inject('parsing') as ParsingStateRef

const isDev = ref(false)
provide('isDev', isDev)
</script>

<template>
  <PileLoad v-if="parsing == 'load'" />

  <PileFailed v-if="parsing == 'failed'" />

  <PileParsed v-if="parsing == 'parsed' || parsing == 'reload'" :pile="pile" />
</template>
