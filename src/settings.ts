import { App, PluginSettingTab, Setting } from 'obsidian'
import type FlakepilesPlugin from './main'

export interface FlakepilePluginSettings {
  enableCommands: boolean
}

export function createPluginSettings(): FlakepilePluginSettings {
  return {
    enableCommands: false,
  }
}

// @ts-expect-error: getSettingDefinitions() overrides display().
export class FlakepileSettingTab extends PluginSettingTab {
  plugin: FlakepilesPlugin

  constructor(app: App, plugin: FlakepilesPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  getSettingDefinitions() {
    return [
      {
        name: 'Enable commands',
        desc: 'Enable command pallete actions and shortcuts.',
        control: {
          type: 'toggle',
          key: 'enableCommands',
        },
      },
      {
        type: 'group',
        heading: 'Advanced',
        items: [
          {
            name: 'Clear unused cache',
            desc: 'Check if there is cache for unused Flakepiles, and delete them.',
            render: (settings: Setting) => {
              settings.addButton((button) => {
                button
                  .setButtonText('Clear')
                  .onClick(() => {
                    void this.plugin.clearUnusedCache()
                  })
              })
            },
          },
          {
            name: 'Clear all cache',
            desc: 'Flakepiles may take longer to load after the deletion.',
            render: (settings: Setting) => {
              settings.addButton((button) => {
                button
                  .setButtonText('Clear')
                  .onClick(() => {
                    void this.plugin.clearAllCache()
                  })
              })
            },
          },
        ],
      },
    ]
  }
}
