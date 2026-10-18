<script setup lang="ts">
import type { FlakepilePluginRef, FlakeType } from '@/custom-view'
import type { Flake, FlakeLabelColor, FlakepileAdaptiveFlow } from '@/schemes/common'
import type { FlakepileLabelsRef, FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { useCssIf, useCssWith } from '@/use'
import { getScrollbarHeight } from '@/utils'
import { ObIcon } from '@/wrappers'
import { delay } from '@rewl/kit'
import { useResizeObserver, useThrottleFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { Notice } from 'obsidian'
import { computed, inject, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import LabelsBadge from '../labels/LabelsBadge.vue'
import FlakeFrame from './FlakeFrame.vue'

const props = withDefaults(
  defineProps<{
    flake: Flake
    flow: FlakepileAdaptiveFlow
    innerHeight: number
    disableDelete?: boolean
  }>(),
  {
    disableDelete: false,
  },
)

const emit = defineEmits<{
  pin: [id: string, value: boolean]
  edit: [id: string]
  delete: [id: string]
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const meta = inject('meta') as FlakepileMetaRef
const labels = inject('labels') as FlakepileLabelsRef

const $scrollable = useTemplateRef('$scrollable')
const $anchor = useTemplateRef('$anchor')
const $meta = useTemplateRef('$meta')
const flakeType = ref<FlakeType>('normal')

/* Dynamic Sizing */

const heightCache = computed(() => plugin.heightCache.value?.heights[props.flake.id] ?? 0)

function updateHeightCache() {
  const heightAnchor = $anchor.value?.scrollHeight ?? 0
  const heightMeta = $meta.value?.scrollHeight ?? 0
  const heightScrollbar = getScrollbarHeight($scrollable.value)
  const height = heightAnchor + heightMeta + heightScrollbar

  const diff = height - heightCache.value
  if (Math.abs(diff) < 2) return

  plugin.updateHeightCache(props.flake.id, height)
}

const updateHeightCacheThrottled = useThrottleFn(updateHeightCache, 10, true)

function initializeHeightCache() {
  if (heightCache.value !== 0) return
  updateHeightCache()
}

onMounted(async () => {
  const type = await plugin.renderContent($anchor.value!, props.flake.content)
  flakeType.value = type

  await nextTick()
  initializeHeightCache()

  await delay(100)
  useResizeObserver([$scrollable, $anchor, $meta], updateHeightCacheThrottled)
})

/* Flake Meta */

const pinned = computed(() => props.flake.meta.pinned)

interface TimeInfo {
  showCreated: boolean
  showModified: boolean
  created?: string
  modified?: string
}

const times = computed<TimeInfo>(() => {
  const info: TimeInfo = {
    showCreated: meta.value.showTimes,
    showModified: meta.value.showTimes,
  }
  if (!meta.value.showTimes) return info

  const created = dayjs(props.flake.meta.createdAt)
  info.created = created.format('YYYY / M / D hh:mm:ss')

  if (props.flake.meta.createdAt === props.flake.meta.modifiedAt) {
    info.showModified = false
  }
  if (!info.showModified) return info

  const modified = dayjs(props.flake.meta.modifiedAt)

  const sameYear = created.year() === modified.year()
  const sameMonth = created.month() === modified.month()
  const sameDate = created.date() === modified.date()

  if (sameYear && sameMonth && sameDate) {
    info.modified = modified.format('hh:mm:ss')
  } else if (sameYear) {
    info.modified = modified.format('M / D hh:mm:ss')
  } else {
    info.modified = modified.format('YYYY / M / D hh:mm:ss')
  }

  return info
})

const showMeta = computed(() => {
  if (props.flake.labels.length !== 0) return true
  if (meta.value.showTimes) return true
  return false
})

/* Flake Labels */

const showLabels = computed(() => {
  return meta.value.showLabels && props.flake.labels.length !== 0
})

interface LabelInfo {
  id: string
  name: string
  color: FlakeLabelColor | 'accent'
}

const flakeLabels = computed<LabelInfo[]>(() => {
  if (!showLabels.value) return []

  let collapsed = 0
  const ids = new Set(props.flake.labels)
  const info: LabelInfo[] = []

  for (const label of labels.value) {
    if (!ids.has(label.id)) {
      continue
    } else if (label.collapsed) {
      collapsed++
    } else {
      info.push({ id: label.id, name: label.name, color: label.color })
    }
  }

  if (collapsed !== 0) {
    info.push({ id: 'plus-n', name: `+${collapsed}`, color: 'accent' })
  }

  return info
})

/* Flake Actions */

async function copyContent() {
  let content = props.flake.content

  // If the Flake only contains one block of code,
  // copy only the content of the code.
  if (flakeType.value === 'code') {
    const raw = content.trim()
    const first = raw.indexOf('\n')
    const last = raw.lastIndexOf('\n')

    if (first === -1 || first >= last) content = ''
    content = raw.slice(first + 1, last)
  }

  try {
    await navigator.clipboard.writeText(content)
    new Notice('Content copied.', 1000)
  } catch (e) {
    console.warn(`Failed to copy the content of Flake ${props.flake.id}: `, e)
    new Notice('Failed to copy content. Check dev console for detail.', 0)
  }
}

const tryDeleting = ref(false)

function tryRequestDelete() {
  if (props.disableDelete) return

  if (meta.value.directDelete) {
    requestDelete()
  } else {
    tryDeleting.value = true
  }
}

function requestDelete() {
  emit('delete', props.flake.id)
}

const ifDisableDelete = useCssIf(() => props.disableDelete, '-disabled')

/* Flake Scrollable State */

const shouldScrollY = computed(() => {
  // TODO: This behavior can be refined with mobile-specific layout options.
  // I'll leave it as is for now.
  if (props.flow === 'mobile') {
    return false
  }

  if (meta.value.enableMaxHeight) {
    return heightCache.value > meta.value.maxHeight + 2
  }
  if (props.flow === 'horizontal') {
    return heightCache.value > props.innerHeight + 2
  }

  return false
})

const ifNoWrap = useCssIf(() => !props.flake.meta.textWrap, '-nowrap')
const ifScrollY = useCssIf(shouldScrollY, '-scrolly')
const withType = useCssWith(flakeType, (val) => `flake-type-${val}`)
</script>

<template>
  <FlakeFrame :class="['flake-view', withType]" :id="flake.id" color="none">
    <div ref="$scrollable" :class="['scrollable', ifScrollY]">
      <div ref="$anchor" :class="['fp-markdown', 'flake-anchor', ifNoWrap]"></div>
    </div>

    <div v-if="showMeta" ref="$meta" class="flake-meta">
      <div v-if="showLabels" class="flake-label-list">
        <LabelsBadge
          v-for="label of flakeLabels"
          :key="label.id"
          :name="label.name"
          :color="label.color"
        />
      </div>

      <div v-if="times.showCreated" class="flake-time">
        <ObIcon name="clock" :size="12" />
        <div>{{ times.created }}</div>
      </div>
      <div v-if="times.showModified" class="flake-time">
        <ObIcon name="rotate-ccw" :size="12" />
        <div>{{ times.modified }}</div>
      </div>
    </div>

    <div v-if="pinned" class="flake-pinned">
      <ObIcon name="pin" color="var(--text-faint)" />
    </div>

    <div class="flake-tooltip">
      <button
        :class="['fp-btn-icon', 'fp-danger', ifDisableDelete]"
        @click="tryRequestDelete"
      >
        <ObIcon name="trash-2" />
      </button>

      <div class="gap"></div>

      <button class="fp-btn-icon" @click="copyContent">
        <ObIcon name="copy" />
      </button>
      <button class="fp-btn-icon" @click="emit('pin', flake.id, !pinned)">
        <ObIcon :name="pinned ? 'pin-off' : 'pin'" />
      </button>
      <button class="fp-btn-icon" @click="emit('edit', flake.id)">
        <ObIcon name="pencil-line" />
      </button>
    </div>

    <div
      v-if="tryDeleting"
      class="flake-view-delete-fuse"
      @click="tryDeleting = false"
    >
      <button
        class="fp-btn-icon fp-warning flake-view-delete"
        @click="requestDelete"
      >
        <ObIcon name="message-circle-question-mark" />
      </button>
    </div>
  </FlakeFrame>
</template>

<style scoped lang="scss">
.flake-view {
  display: grid;
  grid-template-rows: auto max-content;

  > .scrollable {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable both-edges;
  }

  &.flake-type-image > .scrollable,
  &.flake-type-code > .scrollable {
    scrollbar-gutter: auto;
  }

  > .scrollable.-scrolly {
    overflow-y: scroll;
  }
}

.flake-anchor {
  display: flow-root;
  min-height: var(--size-4-10);
  user-select: text;

  &.-nowrap {
    white-space: nowrap;
    width: max-content;

    // Margin space for scrollbar gutters.
    margin-right: calc(2 * var(--scrollbar-width) + 2 * var(--size-4-1));
  }

  .flake-type-code &.-nowrap,
  .flake-type-image &.-nowrap {
    margin-right: 0;
  }

  .flake-type-image & {
    display: flex;
  }

  .is-mobile & {
    // Comply to big mobile buttons.
    min-height: var(--size-4-16);
    padding: var(--size-4-1) var(--size-4-3);
  }

  .is-mobile &.-nowrap {
    margin-right: 0;
  }
}

.flake-meta {
  min-width: 0;
  padding: 0 var(--size-4-2) var(--size-2-1) var(--size-4-2);

  .flake-type-image & {
    padding-top: var(--size-2-1);
  }
}

.flake-label-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  column-gap: var(--size-4-1);
  row-gap: var(--size-4-1);

  margin: var(--size-4-1) 0;
}

.flake-time {
  font-size: var(--font-ui-smaller);
  color: var(--text-faint);

  display: flex;
  justify-content: end;
  column-gap: var(--size-4-1);
  margin: var(--size-2-1) 0;
}

.flake-pinned {
  position: absolute;
  top: var(--size-4-2);
  right: var(--size-4-2);
  z-index: 4;

  pointer-events: none;
}

.flake-tooltip {
  position: absolute;
  inset: var(--size-4-1);
  z-index: 8;

  display: none; // flex when hovered
  column-gap: var(--size-4-1);
  pointer-events: none;

  > button {
    pointer-events: visible;
  }

  > .gap {
    flex-grow: 1;
  }

  .is-mobile & {
    inset: var(--size-4-2);
  }
}

.flake-view:hover > .flake-tooltip {
  display: flex;
}

.flake-view-delete-fuse {
  position: absolute;
  inset: 0;
  z-index: 16;

  background-color: color-mix(in oklch, var(--color-base-00) 75%, transparent);
}

.flake-view-delete {
  position: absolute;
  top: var(--size-4-1);
  left: var(--size-4-1);

  .is-mobile & {
    top: var(--size-4-2);
    left: var(--size-4-2);
  }
}
</style>
