<script setup lang="ts">
import type { FlakepilePlugin } from '@/custom-view.ts'
import { type Flakepile } from '@/schemes/v1'
import { refDebounced, useElementSize, watchThrottled } from '@vueuse/core'
import { computed, inject, onMounted, provide, ref, toRef, useTemplateRef, watch } from 'vue'
import MenuDefault from './flakepile-app/MenuDefault.vue'
import MenuExpanded from './flakepile-app/MenuExpanded.vue'
import MenuShrinked from './flakepile-app/MenuShrinked.vue'

const props = defineProps<{ pile: Flakepile }>()
const plugin = inject('plugin') as FlakepilePlugin

const meta = toRef(props.pile.meta)
watch(meta, plugin.trySave)

const $viewport = useTemplateRef('$viewport')
const viewportSize = useElementSize($viewport)
const viewportWidth = ref(0)

onMounted(() => {
  watchThrottled(viewportSize.width, (value) => {
    viewportWidth.value = value
  }, { throttle: 10 })
})

export interface Environment {
  size: 'small' | 'large'
}

const env = computed<Environment>(() => {
  return {
    size: viewportWidth.value > 600 ? 'large' : 'small',
  }
})

provide('env', env)

const searchQuery = ref<string>('')
const _searchQueryDebounced = refDebounced(searchQuery, 100)

const showOptions = ref(false)
const showLabels = ref(false)
</script>

<template>
  <div ref="$viewport" class="flakepile-layout">
    <div class="flakepile-menu">
      <div class="menu-padding"></div>

      <MenuShrinked
        v-if="meta.menu === 'shrinked'"
        v-model="meta"
      />

      <MenuDefault
        v-if="meta.menu === 'default'"
        v-model="meta"
        v-model:query="searchQuery"
      />

      <MenuExpanded
        v-if="meta.menu === 'expanded'"
        v-model="meta"
        v-model:show-options="showOptions"
        v-model:show-labels="showLabels"
      />

      <div v-if="false" class="header-masking"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/globals.scss" as *;

.flakepile-layout {
  @extend .fp-inset;
  position: fixed;
  top: var(--header-height);
  min-width: 400px;

  display: grid;
  grid-template-rows: min-content auto;

  > .content {
    position: relative;
    background-color: var(--background-primary-alt);
  }
}

.flakepile-menu {
  position: relative;
  overflow-x: hidden;

  padding: var(--size-4-2) var(--size-4-4);
  background-color: var(--background-primary);
  border-bottom: var(--fp-border);

  .is-phone &,
  .is-tablet & {
    padding: var(--size-4-2) var(--size-4-3);
  }
}

.menu-masking {
  @extend .fp-inset;
  position: absolute;
  z-index: 20;

  background-color: color-mix(
    in srgb,
    var(--background-primary),
    transparent 25%
  );
}

.flakepile-content {
  position: relative;
  background-color: var(--background-primary-alt);
}
</style>
