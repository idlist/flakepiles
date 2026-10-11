import obsidianmd from 'eslint-plugin-obsidianmd'
import vue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import ts from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default defineConfig(
  {
    ignores: [
      'node_modules',
      'dist',
      'vite.config.ts',
      'esbuild.config.mjs',
      'eslint.config.mjs',
      'version-bump.mjs',
      'versions.json',
      'main.js',
      // * Temporarily ignore before refactoring finished
      'src/vue',
    ],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ['**/*.vue'],
    extends: [
      ts.configs.recommended,
      ...vue.configs['flat/essential'],
    ],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: ts.parser,
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      ts.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'manifest.json',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json'],
      },
    },
    rules: {
      'obsidianmd/ui/sentence-case': ['warn', {
        brands: ['Flakepile', 'Flakepiles'],
      }],
    },
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-empty': 'off',
      '@typescript-eslint/no-empty-interface': 'off',

      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
    },
  },
)
