import {
  Keymap, MarkdownRenderer, Notice, TextFileView,
  type TFile, type WorkspaceLeaf,
} from 'obsidian'
import {
  createApp, shallowRef, triggerRef, ref,
  type App as VueApp, type Component, type ShallowRef, type Ref,
} from 'vue'
import { createFlakepile, type Flakepile } from './data'
import FlakepileView from './vue/FlakepileView.vue'

export const VIEW_TYPE = 'flakepile'

export type FileRef = ShallowRef<TFile | null>

export type PileRef = Ref<Flakepile>

export interface PileActions {
  save: () => void
  saveLazy: () => void
  injectMarkdown: (elementToInject: HTMLElement, content: string) => Promise<void>
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
      injectMarkdown: async (elementToInject, content) => {
        try {
          elementToInject.innerHTML = ''

          await MarkdownRenderer.render(
            this.app,
            content,
            elementToInject,
            this.file!.path,
            this,
          )

          this.hydrateMarkdown(elementToInject)
        } catch (e) {
          console.warn('Error rendering Flake content: ', e)
        }
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

    this.view.provide('parsed', this.parsed)
    this.view.provide('fileRef', this.fileRef)
    this.view.provide('actions', actions)
    this.view.mount(mountPoint)

    this.registerEvent(this.app.vault.on('rename', () => {
      triggerRef(this.fileRef)
    }))
  }

  hydrateMarkdown(rendered: HTMLElement) {
    const sourcePath = this.file!.path

    // Support internal links.
    rendered.on('click', 'a.internal-link', (e, target) => {
      const linktext = target.getAttribute('data-href')
      if (!linktext) return

      void this.app.workspace.openLinkText(linktext, sourcePath, Keymap.isModEvent(e))
    })

    // Support page preview.
    // Reference: https://gist.github.com/Quorafind/16202a6b07319a63846e7e534e64d8b2
    rendered.on('mouseover', 'a.internal-link', (e, target) => {
      const linktext = target.getAttribute('data-href')
      if (!linktext) return

      this.app.workspace.trigger('hover-link', {
        event: e,
        source: 'preview',
        hoverParent: rendered,
        targetEl: e.currentTarget,
        linktext,
        sourcePath,
      })
    })

    // Support jumping to global search when clicking on a tag.
    // Currently not possible to register tags in custom file type to global search.
    rendered.on('click', 'a.tag', (_, target) => {
      const searchPlugin = this.app.internalPlugins.getEnabledPluginById('global-search')
      if (!searchPlugin) return

      const tagname = target.innerText.trim()
      searchPlugin.openGlobalSearch(`tag:${tagname}`)
    })
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
