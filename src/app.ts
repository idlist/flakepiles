import { TextFileView, type WorkspaceLeaf } from 'obsidian'
import { createApp, type App } from 'vue'
import FlakeList from './FlakeList.vue'

export const VIEW_TYPE = 'noteflakes-view'

export class AppView extends TextFileView {
  vueApp: App | null = null
  // 内存中的数据源，Vue 会直接修改这个对象
  items: unknown[] = []

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType() {
    return VIEW_TYPE
  }

  getDisplayText() {
    return this.file?.basename || 'Card View'
  }

  // 1. 打开视图时：挂载 Vue
  async onOpen() {
    const container = this.containerEl.children[1]!
    container.empty()
    const mountPoint = container.createDiv()

    this.vueApp = createApp(FlakeList, {
      // 将 data 传给 Vue 的 modelValue (对应 defineModel)
      modelValue: this.data,
      // 当 Vue 内部修改数据时触发
      'onUpdate:modelValue': (newData: unknown[]) => {
        this.items = newData
        // 关键：告诉 Obsidian "文件变了，请在后台帮我保存"
        this.requestSave()
      },
    })

    this.vueApp.mount(mountPoint)
  }

  // 2. 关闭视图时：销毁 Vue
  async onClose() {
    if (this.vueApp) {
      this.vueApp.unmount()
      this.vueApp = null
    }
  }

  // 3. 读取文件：Obsidian 从硬盘读到字符串 -> 插件转成 JSON
  setViewData(data: string): void {
    try {
      this.items = data ? JSON.parse(data) : []
    } catch (e) {
      console.error('JSON 解析失败', e)
      this.items = []
    }

    // 如果 Vue 已经在运行，我们需要刷新它显示的数据
    // 为了简单稳定，这里采用重新挂载的方式（生产环境可用 reactive 对象优化，但这样最不容易出错）
    if (this.vueApp) {
      this.vueApp.unmount()
      this.onOpen()
    }
  }

  // 4. 保存文件：Obsidian 要保存时 -> 插件把 JSON 转成字符串
  getViewData(): string {
    return JSON.stringify(this.data, null, 2)
  }

  clear(): void {
    this.items = []
  }
}
