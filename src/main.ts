import { Notice, Plugin, TFolder } from 'obsidian'
import { FlakepileApp, VIEW_TYPE } from './app'
import { createFlakepile } from './data'
import './globals.scss'

export default class Flakepiles extends Plugin {
  flakeCount?: HTMLElement

  onload() {
    // Register Flakepile view.
    this.registerView(
      VIEW_TYPE,
      (leaf) => new FlakepileApp(leaf),
    )

    // Register .flakes (JSON) file type.
    this.registerExtensions(['flakes'], VIEW_TYPE)

    // Register file menu option for creating Flakepile.
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (!(file instanceof TFolder)) return

      menu.addItem((item) => {
        item
          .setTitle('Create new flakepile')
          .setIcon('sticker')
          .onClick(async () => {
            await this.createFlakepileFile(file)
          })
      })
    }))

    // Register status bar item.
    this.flakeCount = this.addStatusBarItem()

    this.registerInterval(window.setInterval(() => {
      this.updateFlakeCount()
    }, 100))

    // Hide other status bar items as most of them are not useful in the custom view.
    this.registerEvent(this.app.workspace.on('file-open', () => {
      this.adjustStatusBar()
    }))
  }

  onunload() {
    document.body.removeClass('is-flakepile')
  }

  async createFlakepileFile(folder?: TFolder) {
    let targetFolder: TFolder

    if (folder) {
      targetFolder = folder
    }
    else {
      const activeFile = this.app.workspace.getActiveFile()
      targetFolder = activeFile?.parent ?? this.app.vault.getRoot()
    }

    const fileBase = 'Untitled'
    const fileExt = 'flakes'
    let fileName = `${fileBase}.${fileExt}`
    const filePath = () => targetFolder.isRoot()
      ? fileName
      : `${targetFolder.path}/${fileName}`

    let suffix = 1
    while (this.app.vault.getAbstractFileByPath(filePath())) {
      fileName = `${fileBase} ${suffix}.${fileExt}`
      suffix++
    }

    try {
      const newFile = await this.app.vault.create(
        filePath(),
        JSON.stringify(createFlakepile()),
      )

      await this.app.workspace.getLeaf().openFile(newFile)
    } catch (e) {
      new Notice('Failed to create flakepile. Check dev console for more info.', 0)
      console.error('Failed to create flakepile: ', e)
    }
  }

  adjustStatusBar() {
    const flakepile = this.app.workspace.getActiveViewOfType(FlakepileApp)

    if (flakepile) {
      document.body.addClass('is-flakepile')
      this.flakeCount?.show()
    }
    else {
      document.body.removeClass('is-flakepile')
      this.flakeCount?.hide()
    }
  }

  updateFlakeCount() {
    const flakepile = this.app.workspace.getActiveViewOfType(FlakepileApp)
    if (!flakepile) return

    this.flakeCount?.setText(`${flakepile.pile.value.flakes.length} flake(s)`)
  }
}
