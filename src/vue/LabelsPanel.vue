<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { PileActions } from '@/view'
import { createLabel, type FlakeLabel, type Flakepile } from '@/data'
import { ObIcon } from '@/components'
import { vFocus, useCssIf } from '@/utils'

const props = defineProps<{ pile: Flakepile }>()
const actions = inject('actions') as PileActions

const moreTools = ref(false)
const newLabelName = ref('')
const editLabelName = ref('')
const editing = ref<string | null>(null)
const filterInvert = computed(() => props.pile.filterInvert)

const toggleInvertFilter = () => {
  props.pile.filterInvert = !props.pile.filterInvert

  for (const label of props.pile.labels) {
    label.filter = !label.filter
  }

  actions.save()
}

const sortByName = (a: FlakeLabel, b: FlakeLabel) => {
  return a.name.localeCompare(b.name)
}

const addLabel = () => {
  var name = newLabelName.value.trim()
  if (name == '') return

  props.pile.labels.push({
    ...createLabel(),
    name,
  })
  props.pile.labels.sort(sortByName)

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

const editBegin = (id: string) => {
  if (editing.value && editing.value != id) {
    editFinish()
  }

  const label = findLabel(id)
  if (!label) return

  editing.value = id
  editLabelName.value = label.name
}

const tryUpdateLabel = () => {
  if (!editing.value) return

  const label = findLabel(editing.value)
  if (!label) return

  label.name = editLabelName.value
}

const editFinish = () => {
  tryUpdateLabel()

  editing.value = null
  editLabelName.value = ''
  actions.save()
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
      <div v-for="label of pile.labels" :key="label.id" class="label-item">
        <template v-if="!moreTools">
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
        </template>

        <template v-else>
          <template v-if="editing != label.id">
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
              @click="() => editBegin(label.id)">
              <ObIcon name="square-pen" />
            </button>

            <button
              class="fp-btn-icon">
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
          </template>

          <template v-else>
            <input v-model="editLabelName"
              v-focus:select
              type="text"
              class="expand"
              placeholder="Edit label..." />

            <button
              class="fp-btn-icon"
              @click="editFinish">
              <ObIcon name="check" />
            </button>
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
}

.label-add {
  @extend %label-row;

  margin-bottom: var(--size-4-2);

  >.invert {
    @extend .fp-invert;
  }
}

.label-input {
  min-width: 0;
  width: auto;
}

.label-list {
  display: grid;
  row-gap: var(--size-4-1);
}

.label-item {
  @extend %label-row;

  min-height: 30px;
  min-width: 0;

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
