<script setup lang="ts">
import type { IsDev } from '@/App.vue'
import type { FlakepileMeta } from '@/schemes/v1'
import type { Environment } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/utils'
import { ObIcon } from '@/wrappers'
import { Platform } from 'obsidian'
import { inject } from 'vue'
import MenuButton from './MenuButton.vue'

const meta = defineModel<FlakepileMeta>({ required: true })
const showOptions = defineModel<boolean>('showOptions', { required: true })
const showLabels = defineModel<boolean>('showLabels', { required: true })

const env = inject('env') as Environment
const isDev = inject('isDev') as IsDev
const useOnlyIcon = useCssIf(() => env.value.size === 'small', '-onlyicon')
</script>

<template>
  <div class="menu-expand">
    <div v-if="Platform.isDesktop && isDev">
      <MenuButton
        :class="['fp-btn-icon-label', useOnlyIcon]"
        icon="import"
        label="Import..."
      />
    </div>

    <div v-if="Platform.isDesktop && isDev">
      <MenuButton
        :class="['fp-btn-icon-label', useOnlyIcon]"
        icon="archive-restore"
        label="Export..."
      />
    </div>

    <div class="gap"></div>

    <template v-if="env.size === 'large'">
      <label>Flow</label>
      <ObIcon v-if="meta.flow == 'vertical'" name="move-vertical" />
      <ObIcon v-if="meta.flow == 'horizontal'" name="move-horizontal" />
      <select v-model="meta.flow" class="dropdown">
        <option value="vertical">Vertical</option>
        <option value="horizontal">Horizontal</option>
      </select>

      <MenuButton
        ref="el-size-options-button"
        class="fp-btn-icon-label"
        icon="scaling"
        label="Options"
        @click="showOptions = !showOptions"
      />
    </template>
  </div>

  <div class="menu-expand">
    <MenuButton
      ref="el-labels-button"
      :class="['fp-btn-icon-label', useOnlyIcon]"
      icon="tags"
      label="Labels"
      @click="showLabels = !showLabels"
    />

    <div class="gap"></div>

    <label>Sort by</label>
    <select v-model="meta.sortBy" class="dropdown">
      <option value="content">Content</option>
      <option value="createdAt">Time created</option>
      <option value="modifiedAt">Time modified</option>
    </select>
    <button
      v-if="meta.sortOrder == 'desc'"
      class="fp-btn-icon"
      @click="meta.sortOrder = 'asc'"
    >
      <ObIcon name="arrow-down-wide-narrow" />
    </button>
    <button
      v-if="meta.sortOrder == 'asc'"
      class="fp-btn-icon"
      @click="meta.sortOrder = 'desc'"
    >
      <ObIcon name="arrow-up-narrow-wide" />
    </button>

    <button
      class="fp-btn-icon"
      @click="meta.menu = 'default'"
    >
      <ObIcon name="cross" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.menu-expand {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  width: 100%;
  font-size: var(--font-ui-small);

  > .gap {
    flex-grow: 1;
  }
}
</style>
