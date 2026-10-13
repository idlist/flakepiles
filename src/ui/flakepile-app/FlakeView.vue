<script setup lang="ts">
import type { IsDevRef } from '@/App.vue'
import type { FlakepilePluginRef } from '@/custom-view'
import type { Flake } from '@/schemes/v1'
import type { FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/use.ts'
import { ObIcon } from '@/wrappers'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import dayjs from 'dayjs'
import { computed, inject, nextTick, onMounted, useTemplateRef } from 'vue'
import FlakeFrame from './FlakeFrame.vue'

const props = withDefaults(
  defineProps<{
    flake: Flake
    innerHeight: number
    disableDelete?: boolean
  }>(),
  {
    disableDelete: false,
  },
)

const emit = defineEmits<{
  pin: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()

const plugin = inject('plugin') as FlakepilePluginRef
const isDev = inject('isDev') as IsDevRef
const meta = inject('meta') as FlakepileMetaRef

const $flake = useTemplateRef('$flake')
const $anchor = useTemplateRef('$anchor')
const $meta = useTemplateRef('$meta')

function updateSizeCache() {
  if (!$flake.value) return

  const $el = $flake.value.$el as HTMLDivElement

  const heightAnchor = $anchor.value?.scrollHeight ?? 0
  const heightMeta = $meta.value?.scrollHeight ?? 0
  const height = heightAnchor + heightMeta

  const diff = height - props.flake.cache.height
  if (Math.abs(diff) < 2) return

  plugin.updateFlakeSizeCache(
    props.flake.id,
    $el.scrollWidth,
    height,
  )
}

const updateSizeCacheDebounced = useDebounceFn(updateSizeCache, 50)

function initializeSizeCache() {
  if (props.flake.cache.width !== 0 && props.flake.cache.height !== 0) return
  updateSizeCache()
}

onMounted(async () => {
  await plugin.renderContent($anchor.value!, props.flake.content)

  await nextTick()
  initializeSizeCache()
  useResizeObserver([$anchor, $meta], updateSizeCacheDebounced)
})

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

  if (props.flake.meta.createdAt !== props.flake.meta.modifiedAt) {
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

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.flake.content)
    plugin.notice('Content copied.', 1000)
  } catch (e) {
    console.warn(`Failed to copy the content of Flake ${props.flake.id}: `, e)
    plugin.notice('Failed to copy content. Check dev console for detail.', 0)
  }
}

function requestDelete() {
  if (props.disableDelete) return
  emit('delete', props.flake.id)
}

const useDisableDelete = useCssIf(() => props.disableDelete, '-disabled')

const shouldScrollY = computed(() => {
  if (meta.value.enableMaxHeight) {
    return props.flake.cache.height > meta.value.maxHeight + 2
  } else {
    return props.flake.cache.height > props.innerHeight + 2
  }
})

const useScrollY = useCssIf(shouldScrollY, '-scrolly')
</script>

<template>
  <FlakeFrame ref="$flake" class="flake-view">
    <div :class="['scrollable', useScrollY]">
      <div ref="$anchor" class="fp-markdown flake-anchor"></div>
    </div>

    <div v-if="showMeta" ref="$meta" class="meta">
      <div v-if="props.flake.labels.length !== 0" class="tag-list"></div>

      <div v-if="times.showCreated" class="flake-time">
        <ObIcon name="clock" :size="12" />
        <div>{{ times.created }}</div>
      </div>
      <div v-if="times.showModified" class="flake-time">
        <ObIcon name="rotate-ccw" :size="12" />
        <div>{{ times.modified }}</div>
      </div>
    </div>

    <div class="flake-tooltip">
      <button
        :class="['fp-btn-icon', 'fp-danger', useDisableDelete]"
        @click="requestDelete"
      >
        <ObIcon name="trash-2" />
      </button>

      <div class="gap"></div>

      <button class="fp-btn-icon" @click="copyContent">
        <ObIcon name="copy" />
      </button>
      <button v-if="isDev" class="fp-btn-icon" @click="emit('pin', flake.id)">
        <ObIcon name="pin" />
      </button>
      <button class="fp-btn-icon" @click="emit('edit', flake.id)">
        <ObIcon name="pencil-line" />
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
  }

  > .scrollable.-scrolly {
    overflow-y: scroll;
  }

  > .meta {
    padding: 0 var(--size-4-2) var(--size-2-1) var(--size-4-2);
  }
}

.flake-anchor {
  display: flow-root;
  padding: 0 var(--size-4-2);
  min-height: var(--size-4-10);
}

.flake-time {
  font-size: var(--font-ui-smaller);
  color: var(--text-faint);

  display: flex;
  justify-content: end;
  column-gap: var(--size-4-1);
  margin: var(--size-2-1) 0;
}

.flake-tooltip {
  position: absolute;
  top: var(--size-4-1);
  left: var(--size-4-1);
  right: var(--size-4-1);
  z-index: 16;

  display: none; // flex when hovered
  column-gap: var(--size-4-1);
  pointer-events: none;

  > button {
    pointer-events: visible;
  }

  > .gap {
    flex-grow: 1;
  }
}

.flake-view:hover > .flake-tooltip {
  display: flex;
}
</style>
