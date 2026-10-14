import './styles/colors.scss'
import './styles/globals.scss'
import './styles/markdown.scss'
import { get, set } from 'idb-keyval'
import { Notice, Plugin, TFolder } from 'obsidian'
import { FlakepileView, VIEW_TYPE } from './custom-view'
import { parseFlakepile } from './schemes/common'
import { createFlakepile, type HeightCacheCollection } from './schemes/v1'
import { createPluginSettings, type FlakepilePluginSettings, FlakepileSettingTab } from './settings'
import { dbKey } from './utils'

export default class FlakepilesPlugin extends Plugin {
  settings = createPluginSettings()
  $flakeCount?: HTMLElement

  async onload() {
    // Setup settings.
    await this.loadSettings()

    this.addSettingTab(new FlakepileSettingTab(this.app, this))

    // Register Flakepile view.
    this.registerView(
      VIEW_TYPE,
      (leaf) => new FlakepileView(leaf),
    )

    // Register .flakes (JSON) file type.
    this.registerExtensions(['flakes'], VIEW_TYPE)

    // Register file menu option for creating Flakepile.
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (!(file instanceof TFolder)) return

      menu.addItem((item) => {
        item
          .setTitle('New Flakepile')
          .setIcon('sticker')
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

    this.registerInterval(window.setInterval(() => {
      this.updateFlakeCount()
    }, 100))

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

  updateFlakeCount() {
    const view = this.app.workspace.getActiveViewOfType(FlakepileView)
    if (!view) return
    if (!view.flakepile.value) return

    // TODO: adapt with tag filters.
    const count = view.flakepile.value.flakes.length
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
    new Notice(`${count} Unused cache cleared.`)
  }

  async clearAllCache() {
    await set(dbKey, {})
    new Notice('All cache cleared.')
  }
}
