<script setup lang="ts">
import type { IsDevRef } from '@/App.vue'
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileAdaptiveFlow, FlakepileMeta } from '@/schemes/v1'
import type { EnvironmentRef } from '@/ui/FlakepileApp.vue'
import { useCssIf, useFlakepileMetaBinder } from '@/use'
import { ObIcon } from '@/wrappers'
import { autoUpdate, offset, shift, useFloating } from '@floating-ui/vue'
import { Menu, Platform } from 'obsidian'
import { type ComponentPublicInstance, inject, useTemplateRef } from 'vue'
import MenuButton from './MenuButton.vue'
import PanelOptions from './PanelOptions.vue'

const props = defineProps<{
  meta: FlakepileMeta
  flow: FlakepileAdaptiveFlow
}>()

const showOptions = defineModel<boolean>('showOptions', { required: true })
const showLabels = defineModel<boolean>('showLabels', { required: true })

const env = inject('env') as EnvironmentRef
const plugin = inject('plugin') as FlakepilePluginRef
const isDev = inject('isDev') as IsDevRef
const ifIconOnly = useCssIf(() => env.value.size === 'small', '-icononly')

const bind = useFlakepileMetaBinder(plugin)
const metaSortBy = bind(props.meta, 'sortBy')
const metaFlow = bind(props.meta, 'flow')
const metaShowTimes = bind(props.meta, 'showTimes')
const metaDirectDelete = bind(props.meta, 'directDelete')

const $buttonOptions = useTemplateRef('$buttonOptions')
const $panelOptions = useTemplateRef<ComponentPublicInstance>('$panelOptions')

const { floatingStyles: stylesPanelOptions } = useFloating(
  $buttonOptions,
  $panelOptions,
  {
    placement: 'bottom-end',
    middleware: [
      offset(4),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  },
)

function toggleOptions(event: MouseEvent) {
  if (Platform.isDesktop) {
    toggleOptionsDesktop()
  }
  if (Platform.isMobile || Platform.isTablet) {
    toggleOptionsMobile(event)
  }
}

function toggleOptionsDesktop() {
  showOptions.value = !showOptions.value
}

function toggleOptionsMobile(event: MouseEvent) {
  const menu = new Menu()

  menu.addItem((item) => {
    item.setTitle('Show times')
    item.setChecked(metaShowTimes.value)
    item.onClick(() => {
      metaShowTimes.value = !metaShowTimes.value
    })
  })
  menu.addItem((item) => {
    item.setTitle('Delete without confirmation')
    item.setChecked(metaDirectDelete.value)
    item.onClick(() => {
      metaDirectDelete.value = !metaDirectDelete.value
    })
  })

  menu.showAtMouseEvent(event)
}
</script>

<template>
  <div class="menu-expand-gap"></div>

  <div class="menu-expand">
    <div v-if="Platform.isDesktop && isDev">
      <MenuButton
        :class="['fp-btn-icon-label', ifIconOnly]"
        icon="import"
        label="Import..."
      />
    </div>

    <div v-if="Platform.isDesktop && isDev">
      <MenuButton
        :class="['fp-btn-icon-label', ifIconOnly]"
        icon="archive-restore"
        label="Export..."
      />
    </div>

    <div class="gap"></div>

    <template v-if="env.size === 'large'">
      <label>Flow</label>
      <ObIcon v-if="metaFlow == 'vertical'" name="move-vertical" />
      <ObIcon v-if="metaFlow == 'horizontal'" name="move-horizontal" />
      <select v-model="metaFlow" class="dropdown">
        <option value="vertical">Vertical</option>
        <option value="horizontal">Horizontal</option>
      </select>
    </template>

    <MenuButton
      ref="$buttonOptions"
      class="fp-btn-icon-label"
      icon="scaling"
      label="Options"
      @click="toggleOptions"
    />
  </div>

  <div class="menu-expand">
    <MenuButton
      v-if="isDev"
      ref="$buttonLabels"
      :class="['fp-btn-icon-label', ifIconOnly]"
      icon="tags"
      label="Labels"
      @click="showLabels = !showLabels"
    />

    <div class="gap"></div>

    <label>Sort by</label>
    <select v-model="metaSortBy" class="dropdown">
      <option value="createdAt">Time created</option>
      <option value="modifiedAt">Time modified</option>
      <option value="content">Content</option>
    </select>
    <button
      v-if="meta.sortOrder == 'desc'"
      class="fp-btn-icon"
      @click="plugin.updateFlakepileMeta('sortOrder', 'asc')"
    >
      <ObIcon name="arrow-down-wide-narrow" />
    </button>
    <button
      v-if="meta.sortOrder == 'asc'"
      class="fp-btn-icon"
      @click="plugin.updateFlakepileMeta('sortOrder', 'desc')"
    >
      <ObIcon name="arrow-up-narrow-wide" />
    </button>

    <button
      class="fp-btn-icon"
      @click="plugin.updateFlakepileMeta('menu', 'default')"
    >
      <ObIcon name="cross" />
    </button>
  </div>

  <Teleport defer to="#fp-floating-area">
    <PanelOptions
      v-if="showOptions"
      ref="$panelOptions"
      :meta="meta"
      :flow="flow"
      :style="stylesPanelOptions"
    />
  </Teleport>
</template>

<style lang="scss" scoped>
.menu-expand-gap {
  padding-bottom: var(--size-2-3);

  .is-phone & {
    padding-bottom: 0;
  }
}

.menu-expand {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  width: 100%;
  font-size: var(--font-ui-small);

  > .gap {
    flex-grow: 1;
  }

  &:last-child {
    padding-top: var(--size-4-1);
  }
}
</style>
