import vue from '@vitejs/plugin-vue'
import { builtinModules } from 'node:module'
import path from 'node:path'
import { defineConfig, normalizePath } from 'vite'
import { type Target, viteStaticCopy as copy } from 'vite-plugin-static-copy'

const external: string[] = [
  'obsidian',
  'electron',
  '@codemirror/autocomplete',
  '@codemirror/collab',
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/lint',
  '@codemirror/search',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr',
  ...builtinModules,
]

const content: string = `/*
THIS IS A BUNDLED FILE BY VITE
Please visit the GitHub repository of this plugin for the source file:
https://github.com/idlist/flakepiles

the distributed file contains bundled third-party libraries,
which retain their original copyrights and licenses.
To see the list of dependencies and their upstream licenses, please refer to:
https://github.com/idlist/flakepiles/blob/main/package.json
*/`

const files = [
  'main.js',
  'styles.css',
  'manifest.json',
]

function toAbsolute(relative: string) {
  return normalizePath(path.resolve(import.meta.dirname, relative))
}

function getFilesToCopy() {
  const targets: Target[] = []

  for (const file of files) {
    targets.push({ src: file, dest: 'dist' })
  }

  return targets
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  const define: Record<string, string> = {}
  if (isProd) {
    define['process.env.NODE_ENV'] = '"production"'
  }

  return {
    define,
    resolve: {
      alias: {
        '@': toAbsolute('./src'),
      },
    },
    build: {
      target: 'es2022',
      outDir: '.',
      emptyOutDir: false,
      sourcemap: isProd ? false : 'inline',
      rollupOptions: {
        external,
        output: {
          postBanner: content,
        },
      },
      lib: {
        entry: 'src/main.ts',
        fileName: () => 'main.js',
        formats: ['cjs'],
        cssFileName: 'styles',
      },
      minify: isProd,
    },
    plugins: [
      vue(),
      copy({ targets: isProd ? getFilesToCopy() : [] }),
    ],
  }
})
