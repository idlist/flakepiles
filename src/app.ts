import { TextFileView, type WorkspaceLeaf } from 'obsidian'
import { createApp, shallowRef, type App, type Component, type ShallowRef } from 'vue'
import FlakepileView from './FlakepileView.vue'
import { createFlakepile, type Flakepile } from './data'

export const VIEW_TYPE = 'flakepile-view'

export class FlakepileApp extends TextFileView {
  view?: App
  pile: ShallowRef<Flakepile | undefined> = shallowRef(undefined)

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

    this.view = createApp(FlakepileView as Component, {
      pile: this.pile,
      onUpdate: () => {
        this.requestSave()
      },
    })

    this.view.mount(mountPoint)
  }

  async onClose() {
    if (this.view) {
      this.view.unmount()
      this.view = undefined
    }
  }

  setViewData(data: string) {
    let updatedPile: Flakepile

    try {
      updatedPile = JSON.parse(data) as Flakepile
    } catch (e) {
      console.error('Cannot parse Flakepile file: ', e)
      return
    }

    this.pile.value = updatedPile
  }

  getViewData(): string {
    return JSON.stringify(this.pile?.value, null, 2)
  }

  clear() {
    this.pile = shallowRef(createFlakepile())
  }
}
