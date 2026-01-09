import { Notice, TextFileView, type TFile, type WorkspaceLeaf } from 'obsidian'
import {
  createApp, shallowRef, triggerRef, ref,
  type App as VueApp, type Component, type ShallowRef, type Ref,
} from 'vue'
import { createFlakepile, type Flakepile } from './data'
import FlakepileView from './vue/FlakepileView.vue'

export const VIEW_TYPE = 'flakepile-view'

export type FileRef = ShallowRef<TFile | null>

export type PileRef = Ref<Flakepile>

export interface PileActions {
  save: () => void
  saveLazy: () => void
  deleteFlake: (id: string) => void
}

export class FlakepileApp extends TextFileView {
  view?: VueApp
  parsed: Ref<boolean> = ref(false)
  fileRef: FileRef = shallowRef(this.file)
  pile: PileRef = ref(createFlakepile())

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType() {
    return VIEW_TYPE
  }

  getDisplayText() {
    return this.file?.basename || 'Flakepile View'
  }

  async onOpen() {
    const container = this.contentEl
    container.empty()
    const mountPoint = container.createEl('div')

    const actions: PileActions = {
      save: () => {
        if (!this.parsed) return
        void this.save()
      },
      saveLazy: () => {
        if (!this.parsed) return
        this.requestSave()
      },
      deleteFlake: (id) => {
        const index = this.pile.value.flakes.findIndex((f) => f.id == id)
        if (index == -1) return
        this.pile.value.flakes.splice(index, 1)
        actions.save()
      },
    }

    this.view = createApp(FlakepileView as Component, {
      pile: this.pile,
    })

    this.view.provide('app', this.app)
    this.view.provide('leaf', this)
    this.view.provide('parsed', this.parsed)
    this.view.provide('fileRef', this.fileRef)
    this.view.provide('actions', actions)
    this.view.mount(mountPoint)

    this.registerEvent(this.app.vault.on('rename', () => {
      triggerRef(this.fileRef)
    }))
  }

  async onClose() {
    if (this.view) {
      this.view.unmount()
      this.view = undefined
    }
  }

  setViewData(data: string) {
    this.fileRef.value = this.file
    let updatedPile: Flakepile

    try {
      updatedPile = JSON.parse(data) as Flakepile
      this.parsed.value = true
    } catch (e) {
      this.parsed.value = false
      new Notice('Cannot parse Flakepile file. Check dev console for more info.', 0)
      console.error('Cannot parse Flakepile file: ', e)
      return
    }

    this.pile.value = updatedPile
  }

  getViewData(): string {
    return JSON.stringify(this.pile.value, null, 2)
  }

  clear() {
    // Do nothing.
  }
}
