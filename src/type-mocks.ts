import 'obsidian'

declare module 'obsidian' {
  interface App {
    // https://fevol.github.io/obsidian-typings/api/obsidian-typings/namespaces/internals/interfaces/internalplugins/
    internalPlugins: {
      // Suppose it would only get enabled plugin, otherwise `null`.
      getEnabledPluginById(id: 'global-search'): null | GlobalSearchPlugin
    }
  }

  // https://fevol.github.io/obsidian-typings/api/obsidian-typings/namespaces/internals/interfaces/globalsearchplugin/
  interface GlobalSearchPlugin {
    openGlobalSearch(query: string): void
  }
}
