<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { useCssIf, useFlakepileMetaBinder } from '@/use'
import { ObIcon } from '@/wrappers'
import { useFocus } from '@vueuse/core'
import { inject, onMounted, ref, useTemplateRef } from 'vue'

const more = defineModel<boolean>('more', { required: true })

const plugin = inject('plugin') as FlakepilePluginRef
const meta = inject('meta') as FlakepileMetaRef

const $inputNewLabel = useTemplateRef('$newInput')
const { focused } = useFocus($inputNewLabel)

const bind = useFlakepileMetaBinder(plugin)
const disableLabelFiltering = bind(meta.value, 'disableLabelFiltering')

const newLabelName = ref('')

onMounted(() => {
  focused.value = true
})

function tryAddLabel() {
  const success = plugin.addLabel(newLabelName.value)

  if (success) {
    newLabelName.value = ''
    focused.value = true
  }
}

function tryAddLabelOnEnter(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    tryAddLabel()
  }
}

const ifDisableFiltering = useCssIf(disableLabelFiltering, 'fp-invert')
const ifMore = useCssIf(more, 'fp-invert')
</script>

<template>
  <div class="fp-labels-item labels-title">
    <button
      :class="['fp-btn-icon', ifDisableFiltering]"
      @click="disableLabelFiltering = !disableLabelFiltering"
    >
      <ObIcon :name="disableLabelFiltering ? 'funnel' : 'funnel-x'" />
    </button>
    <input
      type="text"
      v-model="newLabelName"
      class="expand labels-new-input"
      placeholder="New label..."
      ref="$newInput"
      @keypress="tryAddLabelOnEnter"
    />
    <button class="fp-btn-icon" @click="tryAddLabel">
      <ObIcon name="square-plus" />
    </button>
    <button :class="['fp-btn-icon', ifMore]" @click="more = !more">
      <ObIcon :name="more ? 'undo-2' : 'settings-2'" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.labels-title {
  padding-right: var(--scrollbar-width);

  .is-mobile & {
    padding-right: 0;
  }
}

.labels-new-input {
  width: auto;
}
</style>
