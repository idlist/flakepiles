import { App, PluginSettingTab, Setting, type SettingDefinitionItem } from 'obsidian'
import type FlakepilesPlugin from './main'

export interface FlakepilePluginSettings {
  enableCommands: boolean
  useFontSize: boolean
  fontSize: number
}

export function createPluginSettings(): FlakepilePluginSettings {
  return {
    enableCommands: false,
    useFontSize: false,
    fontSize: 16,
  }
}

export class FlakepileSettingTab extends PluginSettingTab {
  plugin: FlakepilesPlugin

  constructor(app: App, plugin: FlakepilesPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
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
        name: 'Use another font size',
        desc: 'Use a different font size from Obsidian to display Flakes.',
        control: {
          type: 'toggle',
          key: 'useFontSize',
        },
      },
      {
        name: 'Font size',
        desc: 'The font size for the Flakes in your Flakepiles.',
        control: {
          type: 'slider',
          key: 'fontSize',
          min: 10,
          max: 24,
          step: 1,
          defaultValue: 16,
          disabled: () => !this.plugin.settings.useFontSize,
        },
      },
      {
        type: 'group',
        heading: 'Advanced',
        items: [
          {
            name: 'Clear unused cache',
            desc: 'Check if there is cache for Flakepiles that no longer exists.',
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
            desc: 'Flakepiles may take longer to load after this action.',
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

  async setControlValue<T extends keyof FlakepilePluginSettings>(
    key: T,
    value: FlakepilePluginSettings[T],
  ) {
    await super.setControlValue(key, value)

    if (key === 'useFontSize' || key === 'fontSize') {
      this.plugin.updateCustomFontSize()
    }
  }
}
