<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakeLabel } from '@/schemes/v1'
import type { FlakepileLabelsRef } from '@/ui/FlakepileApp.vue'
import { useCssIf } from '@/use'
import { ObIcon } from '@/wrappers'
import { inject, ref } from 'vue'

const plugin = inject('plugin') as FlakepilePluginRef
const labels = inject('labels') as FlakepileLabelsRef

const moreTools = ref(false)
const newLabelName = ref('')
const editLabelName = ref('')
const editingId = ref<string | null>(null)

const filterInvert = ref(false)

function findLabel(id: string): FlakeLabel | undefined {
  return labels.value.find((label) => label.id === id)
}

function toggleFilterInvert() {
  filterInvert.value = !filterInvert.value

  for (const label of labels.value) {
    label.filtered = !label.filtered
  }

  plugin.trySave()
}

function sortLabels() {
  labels.value.sort((a, b) => a.name.localeCompare(b.name))
}

function addLabel() {
  const name = newLabelName.value.trim()
  if (name === '') return

  // plugin.addFlakeLabel(name)
  sortLabels()

  newLabelName.value = ''
}

function removeLabel(id: string) {
  // plugin.deleteFlakeLabel(id)
}

function setFiltered(id: string, value: boolean) {
  const label = findLabel(id)
  if (!label) return

  label.filtered = value
  plugin.trySave()
}

function setShortened(id: string, value: boolean) {
  const label = findLabel(id)
  if (!label) return

  label.shortened = value
  plugin.trySave()
}

function editNameFinish() {
  const label = editingId.value != null ? findLabel(editingId.value) : undefined

  if (label) {
    label.name = editLabelName.value.trim()
    sortLabels()
    plugin.trySave()
  }

  editingId.value = null
  editLabelName.value = ''
}

function editNameBegin(id: string) {
  if (editingId.value != null) {
    editNameFinish()
  }

  const label = findLabel(id)
  if (!label) return

  editingId.value = id
  editLabelName.value = label.name
}

const useInvert = useCssIf(() => filterInvert.value, '-invert')
</script>

<template>
  <div class="menu panel-labels">
    <div class="label-add">
      <button :class="['fp-btn-icon', useInvert]" @click="toggleFilterInvert">
        <ObIcon name="squares-intersect" />
      </button>

      <input
        v-model="newLabelName"
        type="text"
        class="label-input"
        placeholder="New label..."
      />

      <button class="fp-btn-icon" @click="addLabel">
        <ObIcon name="square-plus" />
      </button>

      <button v-if="!moreTools" class="fp-btn-icon" @click="moreTools = true">
        <ObIcon name="settings-2" />
      </button>
      <button v-else class="fp-btn-icon" @click="moreTools = false">
        <ObIcon name="undo-2" />
      </button>
    </div>

    <div class="label-list">
      <div class="inner">
        <template v-for="label of labels" :key="label.id">
          <div
            v-if="editingId != null
            && editingId == label.id"
            class="label-item"
          >
            <input
              v-model="editLabelName"
              type="text"
              class="label-input"
              placeholder="Edit label..."
            />

            <button class="fp-btn-icon" @click="editNameFinish">
              <ObIcon name="check" />
            </button>
          </div>

          <div v-else class="label-item">
            <button
              v-if="!moreTools"
              :class="['fp-btn-icon', useCssIf(() => label.filtered, '')]"
              @click="setFiltered(label.id, !label.filtered)"
            >
              <ObIcon name="eye" />
            </button>

            <button
              v-if="moreTools"
              class="fp-btn-icon"
              @click="removeLabel(label.id)"
            >
              <ObIcon name="trash-2" />
            </button>

            <span class="name" :title="label.name">{{ label.name }}</span>

            <div class="expand"></div>

            <template v-if="moreTools">
              <button class="fp-btn-icon" @click="editNameBegin(label.id)">
                <ObIcon name="square-pen" />
              </button>

              <button class="fp-btn-icon" @click="setShortened(label.id, !label.shortened)">
                <ObIcon name="scissors" />
              </button>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-labels {
  display: grid;
  grid-template-columns: min-content;
  grid-template-rows: min-content 1fr;
  overflow: hidden;

  max-height: 100%;
  padding: 0;
}

.label-add {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  padding: var(--size-4-2) var(--size-4-3) var(--size-4-1) var(--size-4-3);
}

.label-list {
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;

  > .inner {
    display: grid;
    row-gap: var(--size-4-1);

    padding-top: var(--size-4-1);
    padding-bottom: var(--size-4-2);
  }
}

.label-item {
  display: flex;
  align-items: center;
  column-gap: var(--size-4-1);

  min-width: 0;
  padding-left: var(--size-4-3);

  > .expand {
    flex-grow: 1;
  }

  > .label-input {
    width: 100%;
  }

  > .name {
    padding: var(--size-2-1) var(--size-2-3);
    border-radius: var(--size-4-4);

    font-size: var(--font-ui-smaller);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    color: var(--color-base-00);
    background-color: var(--text-normal);
  }
}

.label-input {
  min-width: 0;
}
</style>
