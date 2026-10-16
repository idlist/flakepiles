<script setup lang="ts">
import type { FlakeLabel, FlakeLabelColor } from '@/schemes/common'
import { reactive } from 'vue'
import LabelsColorPicker from './LabelsColorPicker.vue'
import LabelsItemEdit from './LabelsItemEdit.vue'
import LabelsItemView from './LabelsItemView.vue'

const props = defineProps<{
  label: FlakeLabel
  more: boolean
}>()

interface LabelEditingState {
  state: 'none' | 'name' | 'color'
  target: string
}

// TODO: Replace the placeholder refs with the real editing state once it is shared upward.
const editing = reactive<LabelEditingState>({ target: '', state: 'none' })

const save = () => {
  // TODO: Save through the plugin once saving is wired up.
}

const sortLabels = () => {
  // TODO: Sort through the plugin once the global label list is available.
}

const setListed = (id: string, value: boolean) => {
  if (props.label.id != id) return

  props.label.collapsed = !value
  save()
}

const tryApplyLastEdit = () => {
  if (editing.state == 'none') return

  // TODO: Apply the pending name edit once the editing state is lifted upward.
  tryUpdateLabelColor()
}

const editNameBegin = (id: string) => {
  tryApplyLastEdit()

  if (props.label.id != id) return

  editing.target = id
  editing.state = 'name'
}

const tryUpdateLabelName = (name: string) => {
  if (editing.state != 'name') return
  if (editing.target != props.label.id) return

  props.label.name = name
  sortLabels()
}

const editNameFinish = (name: string) => {
  tryUpdateLabelName(name)

  editing.state = 'none'
  save()
}

const tryUpdateLabelColor = (color?: FlakeLabelColor) => {
  if (editing.state != 'color') return

  if (color != null) {
    props.label.color = color
    save()
  }

  // TODO: Update Color
}

const editColorBegin = (id: string) => {
  tryApplyLastEdit()

  if (props.label.id != id) return

  editing.target = id
  editing.state = 'color'
}

const editColorFinish = () => {
  tryUpdateLabelColor()

  editing.state = 'none'
  // TODO: Update Color
}

const remove = (id: string) => {
  if (props.label.id != id) return

  // TODO: Remove through the plugin once the global label list is available.
}
</script>

<template>
  <div v-if="!more" class="label-item">
    <div class="name" :title="label.name">
      {{ label.name }}
    </div>

    <div class="expand"></div>
  </div>

  <template v-else>
    <div
      v-if="editing.state == 'none'
      || editing.state == 'color'
      || editing.state == 'name' && editing.target != label.id"
    >
      <LabelsItemView
        :label="label"
        :editing="editing"
        @remove="remove"
        @edit-name-begin="editNameBegin"
        @edit-color-begin="editColorBegin"
        @edit-color-finish="editColorFinish"
        @set-listed="setListed"
      />

      <LabelsColorPicker
        v-if="editing.state == 'color' && editing.target == label.id"
        :label="label"
        @select="tryUpdateLabelColor"
      />
    </div>

    <LabelsItemEdit
      v-if="editing.state == 'name' && editing.target == label.id"
      :label="label"
      @finish="(name) => editNameFinish(name)"
    />
  </template>
</template>

<style scoped lang="scss">
.label-item {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  min-width: 0;

  &.-colorpicker {
    margin-top: var(--size-4-1);
    padding-top: var(--size-4-1);
    padding-bottom: var(--size-4-1);
    border-top: var(--fp-border);
    border-bottom: var(--fp-border);
    background-color: var(--background-primary-alt);
  }

  > .expand {
    flex-grow: 1;
  }

  > .name {
    color: #ffffff;
    background-color: #333333;

    font-size: var(--font-ui-smaller);
    padding: var(--size-2-1) var(--size-2-3);
    border-radius: var(--size-4-4);

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  > .divider {
    border-right: var(--fp-border);
    height: var(--size-4-6);
  }
}
</style>
