<script setup lang="ts">
import { computed, inject, reactive, ref } from 'vue'
import type { PileActions } from '@/view'
import { createLabel, type FlakeLabel, type Flakepile } from '@/data'
import { ObIcon } from '@/components'
import { vFocus, useCssIf } from '@/utils'

const props = defineProps<{ pile: Flakepile }>()
const actions = inject('actions') as PileActions

interface LabelEditingStatus {
  state: 'idle' | 'name' | 'color'
  target: string
}

const moreTools = ref(false)
const newLabelName = ref('')
const editLabelName = ref('')
const editing = reactive<LabelEditingStatus>({ target: '', state: 'idle' })
const filterInvert = computed(() => props.pile.filterInvert)

const toggleInvertFilter = () => {
  props.pile.filterInvert = !props.pile.filterInvert

  for (const label of props.pile.labels) {
    label.filter = !label.filter
  }

  actions.save()
}

const sortLabels = () => {
  props.pile.labels.sort((a, b) => {
    if (a.name == b.name) {
      return a.createdAt - b.createdAt
    }
    else {
      return a.name.localeCompare(b.name)
    }
  })
}

const addLabel = () => {
  var name = newLabelName.value.trim()
  if (name == '') return

  props.pile.labels.push({
    ...createLabel(),
    name,
  })
  sortLabels()

  actions.save()
  newLabelName.value = ''
}

const findLabel = (id: string): FlakeLabel | undefined => {
  const index = props.pile.labels.findIndex((l) => l.id == id)
  if (index == -1) return
  return props.pile.labels[index]
}

const setFiltered = (id: string, value: boolean) => {
  const label = findLabel(id)
  if (!label) return
  label.filter = value
  actions.save()
}

const setListed = (id: string, value: boolean) => {
  const label = findLabel(id)
  if (!label) return
  label.listed = value
  actions.save()
}

const tryApplyLastEdit = () => {
  if (editing.state == 'idle') return

  tryUpdateLabelName()
  tryUpdateLabelColor()
}

const editNameBegin = (id: string) => {
  tryApplyLastEdit()

  const label = findLabel(id)
  if (!label) return

  editing.target = id
  editing.state = 'name'
  editLabelName.value = label.name
}

const tryUpdateLabelName = () => {
  if (editing.state != 'name') return

  const label = findLabel(editing.target)
  if (!label) return

  label.name = editLabelName.value
  sortLabels()
}

const editNameFinish = () => {
  tryUpdateLabelName()

  editing.state = 'idle'
  editLabelName.value = ''
  actions.save()
}

const tryUpdateLabelColor = () => {
  if (editing.state != 'color') return

  // TODO: Update Color
}

const editColorBegin = (id: string) => {
  tryApplyLastEdit()

  const label = findLabel(id)
  if (!label) return

  editing.target = id
  editing.state = 'color'
}

const editColorFinish = () => {
  tryUpdateLabelColor()

  editing.state = 'idle'
  // TODO: Update Color
}

const remove = (id: string) => {
  const index = props.pile.labels.findIndex((l) => l.id == id)
  if (index == -1) return
  props.pile.labels.splice(index, 1)
  actions.save()
}

const cssFilterInvert = useCssIf(() => filterInvert.value, 'invert')
</script>

<template>
  <div class="fp-obsidian-panel labels-panel">
    <div class="label-add">
      <button
        :class="['fp-btn-icon', cssFilterInvert]"
        @click="toggleInvertFilter">
        <ObIcon name="squares-intersect" />
      </button>

      <input v-model="newLabelName"
        type="text"
        class="expand label-input"
        placeholder="New label..." />

      <button
        class="fp-btn-icon"
        @click="addLabel">
        <ObIcon name="square-plus" />
      </button>

      <button v-if="!moreTools"
        class="fp-btn-icon"
        @click="moreTools = true">
        <ObIcon name="settings-2" />
      </button>

      <button v-if="moreTools"
        class="fp-btn-icon"
        @click="moreTools = false">
        <ObIcon name="undo-2" />
      </button>
    </div>

    <div class="label-list">
      <div class="inner">
        <template v-for="label of pile.labels" :key="label.id">
          <div v-if="!moreTools" class="label-item">
            <button v-if="!label.filter"
              class="fp-btn-icon"
              @click="() => setFiltered(label.id, true)">
              <ObIcon :name="filterInvert ? 'eye-closed' : 'eye'" />
            </button>
            <button v-else
              class="fp-btn-icon invert"
              @click="() => setFiltered(label.id, false)">
              <ObIcon :name="filterInvert ? 'eye' : 'eye-closed'" />
            </button>

            <div class="name" :title="label.name">
              {{ label.name }}
            </div>

            <div class="expand"></div>
          </div>

          <template v-else>
            <div v-if="editing.state == 'idle'
              || editing.state == 'color'
              || editing.state == 'name' && editing.target != label.id">
              <div class="label-item">
                <button
                  class="fp-btn-icon danger"
                  @click="() => remove(label.id)">
                  <ObIcon name="trash-2" />
                </button>

                <div class="name" :title="label.name">
                  {{ label.name }}
                </div>

                <div class="expand"></div>

                <button
                  class="fp-btn-icon"
                  @click="() => editNameBegin(label.id)">
                  <ObIcon name="square-pen" />
                </button>

                <button
                  class="fp-btn-icon"
                  @click="() => editColorBegin(label.id)">
                  <ObIcon name="palette" />
                </button>

                <button v-if="label.listed"
                  class="fp-btn-icon"
                  @click="() => setListed(label.id, false)">
                  <ObIcon name="text-align-start" />
                </button>
                <button v-else
                  class="fp-btn-icon invert"
                  @click="() => setListed(label.id, true)">
                  <ObIcon name="circle-off" />
                </button>
              </div>

              <div v-if="editing.state == 'color' && editing.target == label.id"
                class="label-item -colorpicker">
                <div class="expand"></div>

                <button
                  class="fp-btn-icon"
                  @click="editColorFinish">
                  <ObIcon name="check" />
                </button>
              </div>
            </div>

            <div v-if="editing.state == 'name' && editing.target == label.id"
              class="label-item">
              <input v-model="editLabelName"
                v-focus:select
                type="text"
                class="expand"
                placeholder="Edit label..." />

              <button
                class="fp-btn-icon"
                @click="editNameFinish">
                <ObIcon name="check" />
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/globals.scss' as *;

%label-row {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  >.expand {
    flex-grow: 1;
  }
}

.labels-panel {
  max-width: 320px;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content 1fr;
  overflow: hidden;

  padding: 0;
}

.label-add {
  @extend %label-row;

  padding: var(--size-4-2) var(--size-4-3) var(--size-4-1) var(--size-4-3);

  >.invert {
    @extend .fp-invert;
  }
}

.label-input {
  min-width: 0;
  width: auto;
}

.label-list {
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;

  >.inner {
    display: grid;
    row-gap: var(--size-4-1);
    padding-top: var(--size-4-1);
    padding-bottom: var(--size-4-2);
  }
}

.label-item {
  @extend %label-row;

  min-height: 30px;
  min-width: 0;
  padding-left: var(--size-4-3);

  &.-colorpicker {
    margin-top: var(--size-4-1);
    padding-top: var(--size-4-1);
    padding-bottom: var(--size-4-1);
    border-top: var(--border-width) solid var(--background-modifier-border);
    border-bottom: var(--border-width) solid var(--background-modifier-border);
    background-color: var(--background-primary-alt);
  }

  >input[type=checkbox] {
    margin-right: var(--size-2-1);
  }

  >.name {
    color: #ffffff;
    background-color: #333333;

    font-size: var(--font-ui-smaller);
    padding: var(--size-2-1) var(--size-2-3);
    border-radius: var(--size-4-4);

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  >.danger {
    @extend .fp-danger;
  }

  >.invert {
    @extend .fp-invert;
  }
}
</style>
