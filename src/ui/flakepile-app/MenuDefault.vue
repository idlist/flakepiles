<script setup lang="ts">
import type { FlakepilePlugin } from '@/custom-view'
import type { FlakepileMeta } from '@/schemes/v1'
import type { Environment } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/utils'
import { ObIcon, ObSearch } from '@/wrappers'
import { Platform } from 'obsidian'
import { inject } from 'vue'
import MenuButton from './MenuButton.vue'

const meta = defineModel<FlakepileMeta>({ required: true })
const query = defineModel<string>('query', { required: true })

const emit = defineEmits<{
  new: []
}>()

const plugin = inject('plugin') as FlakepilePlugin
const env = inject('env') as Environment
const useOnlyIcon = useCssIf(() => env.value.size === 'small', '-icononly')
</script>

<template>
  <h1 class="fp-filename menu-filename">
    {{ plugin.meta.filename }}
  </h1>

  <div class="menu-default">
    <button
      v-if="!Platform.isPhone"
      class="fp-btn-icon"
      @click="() => meta.menu = 'shrinked'"
    >
      <ObIcon name="chevrons-down-up" />
    </button>

    <MenuButton
      :class="['fp-btn-icon-label', useOnlyIcon]"
      icon="plus"
      label="New Flake"
      @click="emit('new')"
    />

    <ObSearch v-model="query" class="fullwidth" />

    <button
      class="fp-btn-icon"
      @click="() => meta.menu = 'expanded'"
    >
      <ObIcon name="square-menu" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.menu-filename {
  margin: 0;
  margin-bottom: var(--size-4-2);

  .is-phone & {
    display: none;
  }

  .is-tablet & {
    margin-top: var(--size-4-2);
  }
}

.menu-default {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  width: 100%;
  font-size: var(--font-ui-small);

  > .fullwidth {
    width: 100%;
  }
}
</style>
