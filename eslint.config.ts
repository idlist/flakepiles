import { defineConfig } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import obsidianmd from 'eslint-plugin-obsidianmd'
import globals from 'globals'

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
    ],
  },
  ...(obsidianmd.configs.recommended as unknown[]),
  {
    files: ['**/*.vue'],
    extends: [
      ...ts.configs.recommended,
      ...vue.configs['flat/recommended'],
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
    rules: {
      'vue/html-closing-bracket-newline': ['off'],
      'vue/first-attribute-linebreak': ['off'],
      'vue/singleline-html-element-content-newline': ['off'],

      'vue/html-indent': ['warn', 2, {
        alignAttributesVertically: false,
      }],
      'vue/max-attributes-per-line': ['warn', {
        singleline: { max: Number.POSITIVE_INFINITY },
        multiline: { max: 1 },
      }],
      'vue/html-self-closing': ['warn', {
        html: { normal: 'never', void: 'always' },
      }],
      'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
      'vue/no-mutating-props': ['warn', {
        shallowOnly: true,
      }],
      'vue/v-for-delimiter-style': ['warn', 'of'],
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      ...ts.configs.recommended,
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
      'obsidianmd/ui/sentence-case': 'warn',
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
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // '@stylistic/indent': ['warn', 2, { SwitchCase: 1 }], <- this rule is curently bugged.
      '@stylistic/semi': ['warn', 'never'],
      '@stylistic/quotes': ['warn', 'single', { allowTemplateLiterals: 'always' }],
      '@stylistic/comma-dangle': ['warn', 'always-multiline'],
      '@stylistic/arrow-parens': ['warn', 'always'],
      '@stylistic/eol-last': ['warn', 'always'],
    },
  },
)
