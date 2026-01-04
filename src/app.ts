import { Notice, TextFileView, type TFile, type WorkspaceLeaf } from 'obsidian'
import {
  createApp, shallowRef, triggerRef, ref,
  type App as VueApp, type Component, type ShallowRef, type Ref,
} from 'vue'
import { useElementSize } from '@vueuse/core'
import { createFlakepile, type Flakepile } from './data'
import FlakepileView from './FlakepileView.vue'

export const VIEW_TYPE = 'flakepile-view'

export type FileRef = ShallowRef<TFile | null>

export type PileShallowRef = ShallowRef<Flakepile>

export type ContainerSizeRef = ReturnType<typeof useElementSize>

export class FlakepileApp extends TextFileView {
  view?: VueApp
  parsed: Ref<boolean> = ref(false)
  pile: PileShallowRef = shallowRef(createFlakepile())
  fileRef: FileRef = shallowRef(this.file)
  containerSize?: ContainerSizeRef

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
    this.containerSize = useElementSize(container)

    this.view = createApp(FlakepileView as Component, {
      pile: this.pile,
      onUpdate: () => {
        if (!this.parsed) return
        this.requestSave()
      },
    })

    this.view.provide('app', this.app)
    this.view.provide('leaf', this)
    this.view.provide('parsed', this.parsed)
    this.view.provide('size', this.containerSize)
    this.view.provide('fileRef', this.fileRef)
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

    if (this.containerSize) {
      this.containerSize.stop()
    }
  }

  setViewData(data: string) {
    this.fileRef.value = this.file
    let updatedPile: Flakepile

    try {
      updatedPile = JSON.parse(data) as Flakepile
      this.parsed.value = true
    } catch (e) {
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
    this.pile = shallowRef(createFlakepile())
  }
}
