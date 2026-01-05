import { Notice, Plugin, TFolder } from 'obsidian'
import { FlakepileApp, VIEW_TYPE } from './app'
import { createFlakepile } from './data'
import './globals.scss'

export default class Flakepiles extends Plugin {
  async onload() {
    // Register Flakepile view.
    this.registerView(
      VIEW_TYPE,
      (leaf) => new FlakepileApp(leaf),
    )

    // Register .flakes (JSON) file type.
    this.registerExtensions(['flakes'], VIEW_TYPE)

    // Register command for creating Flakepile.
    this.addCommand({
      id: 'create',
      name: 'Create new Flakepile',
      callback: async () => {
        await this.createFlakepileFile()
      },
    })

    // Register file menu option for creating Flakepile.
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (!(file instanceof TFolder)) return

      menu.addItem((item) => {
        item
          .setTitle('Create new Flakepile')
          .setIcon('sticker')
          .onClick(async () => {
            await this.createFlakepileFile(file)
          })
      })
    }))
  }

  onunload() {
    // Do nothing.
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
      new Notice('Failed to create Flakepile. Check dev console for more info.', 0)
      console.error('Failed to create Flakepile: ', e)
    }
  }
}
