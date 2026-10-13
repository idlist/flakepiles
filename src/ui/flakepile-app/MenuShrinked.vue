<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileMeta } from '@/schemes/v1'
import { ObIcon } from '@/wrappers'
import { inject } from 'vue'

defineProps<{
  meta: FlakepileMeta
}>()

const plugin = inject('plugin') as FlakepilePluginRef
</script>

<template>
  <div class="menu-shrinked">
    <button
      class="fp-btn-icon"
      @click="plugin.updateFlakepileMeta('menu', 'default')"
    >
      <ObIcon name="chevrons-up-down" />
    </button>

    <h6 class="fp-filename filename">
      {{ plugin.meta.filename }}
    </h6>
  </div>
</template>

<style lang="scss" scoped>
.menu-shrinked {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-2);

  > .filename {
    margin: 0;
  }
}
</style>
