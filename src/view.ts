import { Keymap, MarkdownRenderer, Notice, TextFileView, type WorkspaceLeaf } from 'obsidian'
import { createApp, reactive, ref, type App as VueApp, type Component, type Ref } from 'vue'
import parseJson from 'parse-json'
import { createFlakepile, type Flake, type Flakepile } from './data'
import FlakepileApp from './vue/App.vue'
import { noopAsync, CausedError } from './utils'

export const VIEW_TYPE = 'flakepile'

export type PileRef = Ref<Flakepile>

type ParsingState = 'loading' | 'reloading' | 'parsed' | 'failed'

export interface Parsing {
  state: ParsingState
  error: Error | null
}

const initParsing = (): Parsing => {
  return {
    state: 'loading',
    error: null,
  }
}

export interface FileInfo {
  name: string
}

const initFileInfo = (): FileInfo => {
  return {
    name: '',
  }
}

export interface ImageRawSize {
  width: number
  height: number
}

export interface PileActions {
  save: () => void
  saveLazy: () => void
  mountContent: (element: HTMLElement, flake: Flake) => Promise<ImageRawSize | void>
  deleteFlake: (id: string) => void
}

const TICKS = '```'

export class FlakepileView extends TextFileView {
  view?: VueApp
  raw: string = ''
  parsing: Parsing = reactive(initParsing())
  fileInfo: FileInfo = reactive(initFileInfo())
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
        if (this.parsing.state != 'parsed') return
        void this.save()
      },
      saveLazy: () => {
        if (this.parsing.state != 'parsed') return
        this.requestSave()
      },
      mountContent: async (element, flake) => {
        element.empty()

        if (flake.type == 'text') {
          await this.mountMarkdown(element, flake.content)
          this.hydrateMarkdown(element)
        }
        else if (flake.type == 'code') {
          const content =
            `${TICKS}${flake.codeLang}\n${flake.content}\n${TICKS}`

          await this.mountMarkdown(element, content)
          this.codeBlockPostProcess(element)
        }
        else if (flake.type == 'image') {
          return await this.mountImage(element, flake.content)
        }

        return
      },
      deleteFlake: (id) => {
        const index = this.pile.value.flakes.findIndex((f) => f.id == id)
        if (index == -1) return
        this.pile.value.flakes.splice(index, 1)
        actions.save()
      },
    }

    this.view = createApp(FlakepileApp as Component, {
      pile: this.pile,
    })

    this.view.provide('file', this.fileInfo)
    this.view.provide('parsing', this.parsing)
    this.view.provide('actions', actions)
    this.view.mount(mountPoint)

    this.registerEvent(this.app.vault.on('rename', () => {
      this.updateFileInfo()
    }))

    // Comply with Auto-review bot.
    await noopAsync()
  }

  updateFileInfo() {
    this.fileInfo.name = this.file?.basename ?? ''
  }

  async mountMarkdown(element: HTMLElement, content: string) {
    await MarkdownRenderer.render(
      this.app,
      content,
      element,
      this.file!.path,
      this,
    )
  }

  hydrateMarkdown(rendered: HTMLElement) {
    const sourcePath = this.file!.path

    // Disable input of task item checkbox.
    const taskItemChechboxes = rendered.querySelectorAll('.task-list-item>input')

    taskItemChechboxes.forEach((element) => {
      element.setAttrs({ disabled: true })
    })

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

  codeBlockPostProcess(rendered: HTMLElement) {
    const button = rendered.querySelector('pre>button.copy-code-button')
    button?.remove()
  }

  async mountImage(element: HTMLElement, content: string): Promise<ImageRawSize> {
    const sourcePath = this.file!.path
    const imageFile = this.app.metadataCache
      .getFirstLinkpathDest(content, sourcePath)

    if (imageFile) {
      const imagePath = this.app.vault.getResourcePath(imageFile)

      const promise = new Promise<ImageRawSize>((resolve) => {
        element.createEl('img', {
          attr: { class: 'fp-image' },
        }, (imageEl) => {
          const onload = () => {
            imageEl.removeEventListener('load', onload)
            resolve({
              width: imageEl.naturalWidth,
              height: imageEl.naturalHeight,
            })
          }

          imageEl.src = imagePath
          imageEl.addEventListener('load', onload)
        })
      })

      return promise
    }
    else {
      throw new CausedError('Cannot find the image.', 'noImage')
    }
  }

  async onClose() {
    if (this.view) {
      this.view.unmount()
      this.view = undefined
    }

    // Comply with Auto-review bot.
    await noopAsync()
  }

  setViewData(data: string) {
    this.raw = data
    this.parsing.error = null
    this.updateFileInfo()

    if (this.parsing.state == 'failed') {
      this.parsing.state = 'loading'
    }
    if (this.parsing.state == 'parsed') {
      this.parsing.state = 'reloading'
    }

    try {
      const updatedPile = parseJson(data) as unknown as Flakepile

      this.parsing.state = 'parsed'
      this.pile.value = updatedPile
    } catch (e) {
      this.parsing.state = 'failed'

      if (e instanceof Error) {
        this.parsing.error = e
      }
      else {
        new Notice('Cannot parse the flakepile. Please check the dev console for more information.')
        console.error('Cannot parse flakepile: ', e)
      }
    }
  }

  getViewData(): string {
    if (this.parsing.state == 'parsed') {
      return JSON.stringify(this.pile.value, null, 2)
    }
    else {
      return this.raw
    }
  }

  clear() {
    // Do nothing.
  }
}
