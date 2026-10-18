import type { FlakepilePluginRef } from '@/custom-view'
import type { FlakepileMeta } from '@/schemes/common'
import { useFlakepileMetaBinder } from '@/use'
import { Menu } from 'obsidian'

export function useOptionsMobileMenu(plugin: FlakepilePluginRef, meta: FlakepileMeta) {
  const bind = useFlakepileMetaBinder(plugin)

  const metaShowTimes = bind(meta, 'showTimes')
  const metaDirectDelete = bind(meta, 'directDelete')

  const open = () => {
    const menu = new Menu()

    menu.addItem((item) => {
      item.setTitle('Show times')
      item.setChecked(metaShowTimes.value)
      item.onClick(() => {
        metaShowTimes.value = !metaShowTimes.value
      })
    })
    menu.addItem((item) => {
      item.setTitle('Delete without confirmation')
      item.setChecked(metaDirectDelete.value)
      item.onClick(() => {
        metaDirectDelete.value = !metaDirectDelete.value
      })
    })

    menu.showAtPosition({ x: 0, y: 0 })
  }

  return open
}
