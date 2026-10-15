import { get, update } from 'idb-keyval'
import { Keymap, MarkdownRenderer, Notice, TextFileView, type WorkspaceLeaf } from 'obsidian'
import { funnel } from 'remeda'
import { type App as VueApp, type Component, createApp, reactive, ref, toRaw } from 'vue'
import FlakepileApp from './App.vue'
import type FlakepilesPlugin from './main.ts'
import { parseFlakepile } from './schemes/common.ts'
import { dbKey, noopAsync, px } from './utils'

import {
  createFlake,
  createHeightCache,
  type Flake,
  type FlakeMeta,
  type Flakepile,
  type FlakepileMeta,
  type HeightCache,
  type HeightCacheCollection,
} from '@/schemes/common'

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
  plugin: FlakepilesPlugin
  $anchor: HTMLDivElement | null = null
  vueApp: VueApp | null = null
  rawData: string = ''
  meta: PluginMeta = reactive(createAppMeta())

  flakepile = ref<Flakepile | null>(null)
  flakeMap = new Map<string, Flake>()
  heightCache = ref<HeightCache | null>(null)

  constructor(leaf: WorkspaceLeaf, plugin: FlakepilesPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  getViewType() {
    return VIEW_TYPE
  }

  getDisplayText() {
    return this.file?.basename || 'Flakepile View'
  }

  async onOpen() {
    // Create an anchor to mount Vue app.
    const $container = this.contentEl
    $container.empty()
    this.$anchor = $container.createDiv({ cls: 'flakepile-plugin' })

    // Set up custom font size.
    this.useCustomFontSize()

    // Mount Vue app.
    this.vueApp = createApp(FlakepileApp as Component, {
      flakepile: this.flakepile,
    })

    this.vueApp.provide('plugin', this)
    this.vueApp.mount(this.$anchor)

    // Register events.
    this.registerEvent(this.app.vault.on('rename', () => {
      this.updateFileInfo()
    }))

    await noopAsync()
  }

  async onClose() {
    // Unmount Vue app.
    if (this.vueApp) {
      this.vueApp.unmount()
      this.vueApp = null
    }

    // Clean up data.
    this.$anchor?.empty()
    this.$anchor = null

    this.flakepile.value = null
    this.flakeMap = new Map()
    this.heightCache.value = null

    await noopAsync()
  }

  setViewData(data: string) {
    this.rawData = data
    this.meta.loadingError = null
    this.updateFileInfo()

    // Load file data.
    this.loadJsonData()

    // Load height cache.
    void this.loadHeightCache()
  }

  getViewData(): string {
    if (this.meta.loadingState === 'success' && this.flakepile.value != null) {
      return JSON.stringify(this.flakepile.value, null, 2)
    } else {
      return this.rawData
    }
  }

  clear() {
    // Do nothing for now.
  }

  notice(message: string | DocumentFragment, duration?: number) {
    new Notice(message, duration)
  }

  updateFileInfo() {
    this.meta.filename = this.file?.basename ?? ''
  }

  useCustomFontSize() {
    const enable = this.plugin.settings.useFontSize
    const size = this.plugin.settings.fontSize

    if (enable) {
      this.$anchor?.style.setProperty('--flakepile-font-size', px(size))
    } else {
      this.$anchor?.style.removeProperty('--flakepile-font-size')
    }
  }

  trySave() {
    if (this.meta.loadingState !== 'success') return
    void this.save()
  }

  loadJsonData() {
    if (this.meta.loadingState === 'invalid') {
      this.meta.loadingState = 'loading'
    }
    if (this.meta.loadingState === 'success') {
      this.meta.loadingState = 'swapping'
    }

    try {
      const nextFlakepile = parseFlakepile(this.rawData)

      this.meta.loadingState = 'success'
      this.flakepile.value = nextFlakepile
      this.initializeFlakeMap()
    } catch (e) {
      this.meta.loadingState = 'invalid'

      if (e instanceof Error) {
        this.meta.loadingError = e
      }

      new Notice('Cannot parse the Flakepile. Check the dev console for more information.')
      console.error('Cannot parse Flakepile: ', e)
    }
  }

  async loadHeightCache() {
    if (this.flakepile.value == null) return
    const pile = this.flakepile.value

    const collection = await get<HeightCacheCollection>(dbKey)
    if (typeof collection === 'undefined' || !(pile.id in collection)) {
      this.heightCache.value = createHeightCache()
      return
    }

    this.heightCache.value = collection[pile.id]!
  }

  async saveHeightCache() {
    if (this.flakepile.value == null) return
    if (this.heightCache.value == null) return
    if (Object.isEmpty(this.heightCache.value.heights)) return

    const pile = this.flakepile.value

    await update<HeightCacheCollection>(dbKey, (collection) => {
      if (!collection) collection = {}
      collection[pile.id] = toRaw(this.heightCache.value)!
      return collection
    })
  }

  heightCacheLazySave = funnel(
    () => {
      void this.saveHeightCache()
    },
    { minGapMs: 100, triggerAt: 'both' },
  )

  updateHeightCache(id: string, height: number) {
    if (!this.heightCache.value) return
    this.heightCache.value.heights[id] = height
    this.heightCacheLazySave.call()
  }

  clearHeightCache(id: string) {
    this.updateHeightCache(id, 0)
  }

  clearAllHeightCache() {
    if (!this.heightCache.value) return
    this.heightCache.value.heights = {}
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

    // Postprocess rendered markdown.
    this.postprocessMarkdown($anchor)
  }

  postprocessMarkdown($anchor: HTMLElement) {
    if (!this.file) return
    const sourcePath = this.file.path

    // Disable input of task item checkbox.
    const taskItemChechboxes = $anchor.querySelectorAll('.task-list-item > input')

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

  initializeFlakeMap() {
    if (!this.flakepile.value) return

    this.flakeMap = new Map()
    for (const flake of this.flakepile.value.flakes) {
      this.flakeMap.set(flake.id, flake)
    }
  }

  updateFlakepileMeta<T extends keyof FlakepileMeta>(key: T, value: FlakepileMeta[T]) {
    if (!this.flakepile.value) return

    this.flakepile.value.meta[key] = value
    this.trySave()
  }

  addFlake(): string | null {
    if (!this.flakepile.value) return null

    const flakes = this.flakepile.value.flakes
    flakes.push(createFlake())

    const flake = flakes[flakes.length - 1]!
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

  updateFlakeMeta<T extends keyof FlakeMeta>(id: string, key: T, value: FlakeMeta[T]) {
    if (!this.flakepile.value) return

    const flake = this.flakeMap.get(id)
    if (!flake) return

    flake.meta[key] = value
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
}

export type FlakepilePluginRef = Pick<
  FlakepileView,
  | 'meta'
  | 'flakeMap'
  | 'heightCache'
  | 'notice'
  | 'heightCacheLazySave'
  | 'updateHeightCache'
  | 'renderContent'
  | 'updateFlakepileMeta'
  | 'addFlake'
  | 'deleteFlake'
  | 'updateFlakeMeta'
  | 'updateFlakeContent'
>
