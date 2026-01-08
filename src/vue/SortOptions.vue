<script setup lang="ts">
import type { Flakepile } from '@/data'
import { ObIcon } from '@/components'

const sortBy = defineModel<Flakepile['sortBy']>('sort-by')
const sortOrder = defineModel<Flakepile['sortOrder']>('sort-order')
</script>

<template>
  <div>
    <label>Sort By</label>
    <select v-model="sortBy" class="dropdown">
      <option value="name">Name</option>
      <option value="createdAt">Time Created</option>
      <option value="modifiedAt">Time Modified</option>
    </select>
    <button
      v-if="sortOrder == 'desc'"
      class="fp-btn-icon"
      @click="sortOrder = 'asc'">
      <ObIcon name="arrow-down-wide-narrow" />
    </button>
    <button
      v-if="sortOrder == 'asc'"
      class="fp-btn-icon"
      @click="sortOrder = 'desc'">
      <ObIcon name="arrow-up-narrow-wide" />
    </button>
  </div>
</template>
