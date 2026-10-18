<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileMetaRef } from '@/ui/FlakepileApp.vue'
import { useCssIf, useFlakepileMetaBinder } from '@/use'
import { ObIcon } from '@/wrappers'
import { inject, ref } from 'vue'

const more = defineModel<boolean>('more', { required: true })

const plugin = inject('plugin') as FlakepilePluginRef
const meta = inject('meta') as FlakepileMetaRef

const bind = useFlakepileMetaBinder(plugin)
const disableLabelFiltering = bind(meta.value, 'disableLabelFiltering')

const newLabelName = ref('')

const addLabel = () => {
  const success = plugin.addLabel(newLabelName.value)
  if (success) {
    newLabelName.value = ''
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
      v-model="newLabelName"
      type="text"
      class="expand labels-new-input"
      placeholder="New label..."
    />
    <button class="fp-btn-icon" @click="addLabel">
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
  min-width: 120px;
  width: auto;
}
</style>
