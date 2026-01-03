import { Plugin, TFolder } from 'obsidian'
import { AppView, VIEW_TYPE } from './app'

export default class Noteflakes extends Plugin {
  async onload() {
    // Register Noteflake view
    this.registerView(
      VIEW_TYPE,
      (leaf) => new AppView(leaf),
    )

    this.registerExtensions(['noteflakes'], VIEW_TYPE)

    this.addRibbonIcon('sticker', 'Create a box for Noteflakes', async (_) => {
      await this.createNewNoteflakes()
    })

    this.addCommand({
      id: 'create-noteflakes-file',
      name: '新建 Noteflakes 卡片盒',
      callback: async () => {
        await this.createNewNoteflakes()
      },
    })

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (!(file instanceof TFolder)) return

        menu.addItem((item) => {
          item
            .setTitle('新建 Noteflakes 卡片盒')
            .setIcon('sticker')
            .onClick(async () => {
              await this.createNewNoteflakes(file)
            })
        })
      }),
    )
  }

  onunload() {
    // Unload
  }

  /**
   * 核心方法：创建并打开新文件
   * @param folder (可选) 指定在哪个文件夹下创建，默认为当前活动文件所在目录或根目录
   */
  async createNewNoteflakes(folder?: TFolder) {
    // 1. 确定目标文件夹
    let targetFolder = folder
    if (!targetFolder) {
      const activeFile = this.app.workspace.getActiveFile()
      // 如果当前聚焦的是文件，就取其父目录；否则取根目录
      if (activeFile) {
        targetFolder = activeFile.parent || this.app.vault.getRoot()
      } else {
        targetFolder = this.app.vault.getRoot()
      }
    }

    // 2. 寻找可用的文件名 (防止覆盖)
    // 目标：Untitled.noteflakes, Untitled 1.noteflakes ...
    const baseName = '未命名看板'
    const extension = 'noteflakes'
    let fileName = `${baseName}.${extension}`
    let filePath = `${targetFolder.path}/${fileName}`

    // 如果是根目录，路径不要双斜杠
    if (targetFolder.isRoot()) {
      filePath = fileName
    }

    let i = 1
    // 循环检查文件是否存在
    while (await this.app.vault.adapter.exists(filePath)) {
      fileName = `${baseName} ${i}.${extension}`
      filePath = targetFolder.isRoot()
        ? fileName
        : `${targetFolder.path}/${fileName}`
      i++
    }

    try {
      // 3. 创建文件
      // 注意：初始内容必须是 "[]" (空数组的 JSON)，否则 JSON.parse 会报错
      const newFile = await this.app.vault.create(filePath, '[]')

      // 4. 在新标签页中打开它
      await this.app.workspace.getLeaf(true).openFile(newFile)

    } catch (error) {
      console.error('创建文件失败:', error)
      // new Notice("创建失败: " + error.message); // 可以引入 Notice 组件提示用户
    }
  }
}
