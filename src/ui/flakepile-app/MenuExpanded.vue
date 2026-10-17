<script setup lang="ts">
import type { IsDevRef } from '@/App.vue'
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileAdaptiveFlow, FlakepileMeta } from '@/schemes/common'
import type { EnvironmentRef } from '@/ui/FlakepileApp.vue'
import { useCssIf, useFlakepileMetaBinder } from '@/use'
import { idFloatingArea } from '@/utils'
import { ObIcon } from '@/wrappers'
import { autoUpdate, offset, shift, useFloating } from '@floating-ui/vue'
import { Platform } from 'obsidian'
import { inject, useTemplateRef } from 'vue'
import LabelsMobileModal from './LabelsMobileModal.vue'
import LabelsPanel from './LabelsPanel.vue'
import MenuButton from './MenuButton.vue'
import { useOptionsMobileMenu } from './OptionsMobileMenu'
import OptionsPanel from './OptionsPanel.vue'

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

/* Options Panel */

const $optionsButton = useTemplateRef('$optionsButton')
const $optionsPanel = useTemplateRef<InstanceType<typeof OptionsPanel>>('$optionsPanel')

const { floatingStyles: optionsPanelStyle } = useFloating(
  $optionsButton,
  $optionsPanel,
  {
    placement: 'bottom-end',
    middleware: [
      offset(4),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  },
)

const openOptionsMobileMenu = useOptionsMobileMenu(plugin, props.meta)

function toggleOptions() {
  if (Platform.isDesktop || Platform.isTablet) {
    showOptions.value = !showOptions.value
  }
  if (Platform.isPhone) {
    openOptionsMobileMenu()
  }
}

/* Labels Panel */

const $labelsButton = useTemplateRef('$labelsButton')
const $labelsPanel = useTemplateRef<InstanceType<typeof LabelsPanel>>('$labelsPanel')

const { floatingStyles: labelsPanelStyle } = useFloating(
  $labelsButton,
  $labelsPanel,
  {
    placement: 'bottom-start',
    middleware: [
      offset(4),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  },
)

const $labelsMobileModal = useTemplateRef('$labelsMobileModal')

function toggleLabels() {
  if (Platform.isDesktop) {
    showLabels.value = !showLabels.value
  }
  if (Platform.isMobile) {
    $labelsMobileModal.value?.open()
  }
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
      ref="$optionsButton"
      class="fp-btn-icon-label"
      icon="scaling"
      label="Options"
      @click="toggleOptions"
    />
  </div>

  <div class="menu-expand menu-expand-row">
    <MenuButton
      ref="$labelsButton"
      :class="['fp-btn-icon-label', ifIconOnly]"
      icon="tags"
      label="Labels"
      @click="toggleLabels"
    />

    <div class="gap"></div>

    <label>Sort</label>
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
      class="fp-btn-icon fp-invert"
      @click="plugin.updateFlakepileMeta('menu', 'default')"
    >
      <ObIcon name="cross" />
    </button>
  </div>

  <Teleport defer :to="`#${idFloatingArea}`">
    <OptionsPanel
      v-if="showOptions"
      ref="$optionsPanel"
      :style="optionsPanelStyle"
      :meta="meta"
      :flow="flow"
    />

    <LabelsPanel
      v-if="showLabels"
      ref="$labelsPanel"
      :style="labelsPanelStyle"
    />
  </Teleport>

  <LabelsMobileModal ref="$labelsMobileModal" />
</template>

<style lang="scss" scoped>
.menu-expand-gap {
  padding-bottom: var(--size-2-3);

  .is-mobile & {
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
}

.menu-expand-row {
  padding-top: var(--size-4-1);
}
</style>
