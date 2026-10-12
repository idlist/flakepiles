import { createFlake, type Flake, type Flakepile } from '@/schemes/v1'
import { Keymap, MarkdownRenderer, Notice, TextFileView, type WorkspaceLeaf } from 'obsidian'
import { type App as VueApp, type Component, createApp, reactive, ref } from 'vue'
import FlakepileApp from './App.vue'
import { noopAsync } from './utils'

export const VIEW_TYPE = 'flakepile'

type LoadingState = 'loading' | 'swapping' | 'success' | 'invalid'

export interface PluginMeta {
  loadingState: LoadingState
  loadingError: Error | null
  filename: string
}

function createAppMeta(): PluginMeta {
  return {
    loadingState: 'loading',
    loadingError: null,
    filename: '',
  }
}

export class FlakepileView extends TextFileView {
  vueApp: VueApp | null = null
  rawData: string = ''
  meta: PluginMeta = reactive(createAppMeta())
  flakepile = ref<Flakepile | null>(null)
  flakeMap = new Map<string, Flake>()

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
    const $container = this.contentEl
    $container.empty()
    const $anchor = $container.createDiv({ cls: 'flakepile-reset' })

    this.vueApp = createApp(FlakepileApp as Component, {
      flakepile: this.flakepile,
    })

    this.vueApp.provide('plugin', this)
    this.vueApp.mount($anchor)

    this.registerEvent(this.app.vault.on('rename', () => {
      this.updateFileInfo()
    }))

    // Comply with Auto-review bot.
    await noopAsync()
  }

  async onClose() {
    if (this.vueApp) {
      this.vueApp.unmount()
      this.vueApp = null
    }

    this.flakepile.value = null
    await noopAsync()
  }

  setViewData(data: string) {
    this.rawData = data
    this.meta.loadingError = null
    this.updateFileInfo()

    if (this.meta.loadingState === 'invalid') {
      this.meta.loadingState = 'loading'
    }
    if (this.meta.loadingState === 'success') {
      this.meta.loadingState = 'swapping'
    }

    try {
      const nextFlakepile = JSON.parse(data) as Flakepile

      this.meta.loadingState = 'success'
      this.flakepile.value = nextFlakepile
      this.initializeFlakeMap()
    } catch (e) {
      this.meta.loadingState = 'invalid'

      if (e instanceof Error) {
        this.meta.loadingError = e
      } else {
        new Notice('Cannot parse the Flakepile. Check the dev console for more information.')
        console.error('Cannot parse Flakepile: ', e)
      }
    }
  }

  getViewData(): string {
    if (this.meta.loadingState === 'success' && this.flakepile != null) {
      return JSON.stringify(this.flakepile.value, null, 2)
    } else {
      return this.rawData
    }
  }

  clear() {
    this.vueApp = null
    this.flakepile.value = null
  }

  updateFileInfo() {
    this.meta.filename = this.file?.basename ?? ''
  }

  trySave() {
    if (this.meta.loadingState !== 'success') return
    void this.save()
  }

  trySaveLazy() {
    if (this.meta.loadingState !== 'success') return
    this.requestSave()
  }

  async renderContent($anchor: HTMLElement, content: string) {
    if (!this.file) return
    const sourcePath = this.file.path

    // Render the markdown using Obsidian's internal renderer.
    await MarkdownRenderer.render(
      this.app,
      content,
      $anchor,
      sourcePath,
      this,
    )

    // Disable input of task item checkbox.
    const taskItemChechboxes = $anchor.querySelectorAll('.task-list-item>input')

    taskItemChechboxes.forEach((element) => {
      element.setAttrs({ disabled: true })
    })

    // Support internal links.
    $anchor.on('click', 'a.internal-link', (event, $target) => {
      const linktext = $target.getAttribute('data-href')
      if (!linktext) return

      void this.app.workspace.openLinkText(linktext, sourcePath, Keymap.isModEvent(event))
    })

    // Support previewing other pages inside a Flakepile.
    // Reference: https://gist.github.com/Quorafind/16202a6b07319a63846e7e534e64d8b2
    $anchor.on('mouseover', 'a.internal-link', (event, $target) => {
      const linktext = $target.getAttribute('data-href')
      if (!linktext) return

      this.app.workspace.trigger('hover-link', {
        event,
        source: 'preview',
        hoverParent: $anchor,
        targetEl: event.currentTarget,
        linktext,
        sourcePath,
      })
    })
  }

  notice(message: string | DocumentFragment, duration?: number) {
    new Notice(message, duration)
  }

  initializeFlakeMap() {
    if (!this.flakepile.value) return

    this.flakeMap = new Map()
    for (const flake of this.flakepile.value.flakes) {
      this.flakeMap.set(flake.id, flake)
    }
  }

  addFlake(): string | null {
    if (!this.flakepile.value) return null

    const flake = createFlake()
    this.flakepile.value.flakes.push(flake)
    this.flakeMap.set(flake.id, flake)
    this.trySave()

    return flake.id
  }

  deleteFlake(id: string) {
    if (!this.flakepile.value) return

    const flakes = this.flakepile.value.flakes
    const index = flakes.findIndex((flake) => flake.id === id)
    if (index === -1) return

    this.flakepile.value.flakes.splice(index, 1)
    this.flakeMap.delete(id)
    this.trySave()
  }

  updateFlakeContent(id: string, content: string) {
    if (!this.flakepile.value) return

    const flake = this.flakeMap.get(id)
    if (!flake) return

    flake.content = content
    flake.meta.modifiedAt = Date.now()
    this.trySave()
  }

  updateFlakeSizeCache(id: string, width: number, height: number) {
    if (!this.flakepile.value) return

    const flake = this.flakeMap.get(id)
    if (!flake) return

    flake.cache.width = width
    flake.cache.height = height
    this.trySave()
  }

  clearAllFlakeSizeCache() {
    if (!this.flakepile.value) return

    for (const flake of this.flakepile.value.flakes) {
      flake.cache.width = 0
      flake.cache.height = 0
    }

    this.trySave()
  }
}

export type FlakepilePlugin = Pick<
  FlakepileView,
  | 'meta'
  | 'trySave'
  | 'trySaveLazy'
  | 'notice'
  | 'renderContent'
  | 'flakeMap'
  | 'addFlake'
  | 'deleteFlake'
  | 'updateFlakeContent'
  | 'updateFlakeSizeCache'
  | 'clearAllFlakeSizeCache'
>
