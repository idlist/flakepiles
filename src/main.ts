import './styles/colors.scss'
import './styles/globals.scss'
import './styles/markdown.scss'
import { get, set } from 'idb-keyval'
import { addIcon, Notice, Plugin, TFolder } from 'obsidian'
import { FlakepileView, VIEW_TYPE } from './custom-view'
import { createFlakepile, type HeightCacheCollection, parseFlakepile } from './schemes/common'
import { createPluginSettings, type FlakepilePluginSettings, FlakepileSettingTab } from './settings'
import { dbKey } from './utils'

export default class FlakepilesPlugin extends Plugin {
  settings = createPluginSettings()
  $flakeCount?: HTMLElement

  async onload() {
    addIcon(
      'flakepile',
      /* svg */ `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m11 20-7.194-6.948" />
  <path d="M15 21h4a2 2 0 002-2V9h-5a1 1 0 01-1-1V3H5a2 2 0 00-2 2v4" />
  <path d="m2.5 18 9.614-2.757" />
  <path d="M21 9a2.4 2.4 0 00-.706-1.706l-3.588-3.588A2.4 2.4 0 0015 3" />
  <path d="m6 21.5 2.42-9.704" />
</svg>
`,
    )

    // Setup settings.
    await this.loadSettings()

    this.addSettingTab(new FlakepileSettingTab(this.app, this))

    // Register Flakepile view.
    this.registerView(
      VIEW_TYPE,
      (leaf) => new FlakepileView(leaf, this),
    )

    // Register .flakes (JSON) file type.
    this.registerExtensions(['flakes'], VIEW_TYPE)

    // Register file menu option for creating Flakepile.
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (!(file instanceof TFolder)) return

      menu.addItem((item) => {
        item
          .setTitle('New Flakepile')
          .setIcon('flakepile')
          .onClick(async () => {
            await this.createFlakepileFile(file)
          })
      })
    }))

    // Register "New Flakepile" command.
    this.addCommand({
      id: 'new',
      name: 'Create a new Flakepile',
      checkCallback: (checking) => {
        if (this.settings.enableCommands) {
          if (!checking) {
            void this.createFlakepileFile()
          }
          return true
        }
        return false
      },
    })

    // Register status bar item.
    this.$flakeCount = this.addStatusBarItem()

    // Hide other status bar items as most of them are not useful in the custom view.
    this.registerEvent(this.app.workspace.on('file-open', () => {
      this.updateStatusBar()
    }))
  }

  onunload() {
    this.removeCssMarker()
  }

  async loadSettings() {
    const settingsData = await this.loadData() as FlakepilePluginSettings
    this.settings = Object.assign(createPluginSettings(), settingsData)
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  async createFlakepileFile(folder?: TFolder) {
    let targetFolder: TFolder

    if (folder) {
      targetFolder = folder
    } else {
      const activeFile = this.app.workspace.getActiveFile()
      targetFolder = activeFile?.parent ?? this.app.vault.getRoot()
    }

    const basename = 'Untitled'
    const extension = 'flakes'
    let filename = `${basename}.${extension}`

    const assembleFilePath = () =>
      targetFolder.isRoot()
        ? filename
        : `${targetFolder.path}/${filename}`

    let count = 1
    while (this.app.vault.getAbstractFileByPath(assembleFilePath())) {
      filename = `${basename} ${count}.${extension}`
      count++
    }

    try {
      const newFile = await this.app.vault.create(
        assembleFilePath(),
        JSON.stringify(createFlakepile()),
      )

      await this.app.workspace.getLeaf().openFile(newFile)
    } catch (e) {
      new Notice('Failed to create Flakepile. Check dev console for more information.', 0)
      console.error('Failed to create Flakepile: ', e)
    }
  }

  injectCssMarker() {
    document.body.addClass('is-flakepile')
  }

  removeCssMarker() {
    document.body.removeClass('is-flakepile')
  }

  updateStatusBar() {
    const view = this.app.workspace.getActiveViewOfType(FlakepileView)

    if (view) {
      this.injectCssMarker()
      this.$flakeCount?.show()
    } else {
      this.removeCssMarker()
      this.$flakeCount?.hide()
    }
  }

  updateFlakeCount(count: number) {
    this.$flakeCount?.setText(`${count} Flake${count === 1 ? '' : 's'}`)
  }

  async clearUnusedCache() {
    const collection = await get<HeightCacheCollection>(dbKey)
    if (!collection) return

    const allFiles = this.app.vault.getFiles()
    const allFlakepiles = allFiles.filter((f) => f.extension === 'flakes')

    const aliveIds = new Set<string>()

    await Promise.allSettled(allFlakepiles.map(async (f) => {
      const content = await this.app.vault.read(f)
      const pile = parseFlakepile(content)
      aliveIds.add(pile.id)
    }))

    let count = 0
    for (const id of Object.keys(collection)) {
      if (!aliveIds.has(id)) {
        delete collection[id]
        count++
      }
    }

    await set(dbKey, collection)
    new Notice(`${count} unused cache cleared.`)
  }

  async clearAllCache() {
    await set(dbKey, {})
    new Notice('All cache cleared.')
  }

  updateCustomFontSize() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE)

    for (const leaf of leaves) {
      if (leaf.view instanceof FlakepileView) {
        leaf.view.useCustomFontSize()
      }
    }
  }
}
