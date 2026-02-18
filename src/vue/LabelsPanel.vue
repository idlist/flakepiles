<script setup lang="ts">
import { inject, ref } from 'vue'
import type { PileActions } from '@/view'
import { createLabel, type FlakeLabel, type Flakepile } from '@/data'
import { ObIcon } from '@/components'

const props = defineProps<{ pile: Flakepile }>()
const actions = inject('actions') as PileActions

const moreTools = ref(false)
const labelInput = ref('')
const editing = ref<string | null>(null)

const addLabel = () => {
  var name = labelInput.value.trim()
  if (name == '') return

  props.pile.labels.push({
    ...createLabel(),
    name,
  })

  actions.save()
  labelInput.value = ''
}

const findLabel = (id: string): FlakeLabel | undefined => {
  const index = props.pile.labels.findIndex((l) => l.id == id)
  if (index == -1) return
  return props.pile.labels[index]
}

const setFiltered = (id: string, value: boolean) => {
  const label = findLabel(id)
  if (!label) return
  label.filtered = value
  actions.save()
}

const setListed = (id: string, value: boolean) => {
  const label = findLabel(id)
  if (!label) return
  label.listed = value
  actions.save()
}

const editBegin = (id: string) => {
  editing.value = id
}

const editFinish = () => {
  editing.value = null
}

const remove = (id: string) => {
  const index = props.pile.labels.findIndex((l) => l.id == id)
  if (index == -1) return
  props.pile.labels.splice(index, 1)
  actions.save()
}
</script>

<template>
  <div class="fp-obsidian-panel labels-panel">
    <div class="label-add">
      <input v-model="labelInput"
        type="text"
        class="expand label-input" />

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
        <template v-if="moreTools">
          <button v-if="editing != label.id"
            class="fp-btn-icon danger"
            @click="() => remove(label.id)">
            <ObIcon name="trash-2" />
          </button>
        </template>

        <template v-else>
          <button v-if="!label.filtered"
            class="fp-btn-icon"
            @click="() => setFiltered(label.id, true)">
            <ObIcon name="eye" />
          </button>

          <button v-else
            class="fp-btn-icon invert"
            @click="() => setFiltered(label.id, false)">
            <ObIcon name="eye-closed" />
          </button>
        </template>

        <div v-if="editing != label.id"
          class="name"
          :title="label.name">
          {{ label.name }}
        </div>

        <div class="expand"></div>

        <template v-if="moreTools">
          <template v-if="editing != label.id">
            <button
              class="fp-btn-icon"
              @click="() => editBegin(label.id)">
              <ObIcon name="square-pen" />
            </button>

            <button
              class="fp-btn-icon">
              <ObIcon name="pipette" />
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
  min-width: 280px;
  max-width: 320px;
}

.label-add {
  @extend %label-row;

  margin-bottom: var(--size-4-2);
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
