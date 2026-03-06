import { nanoid } from 'nanoid'
import type { Ref } from 'vue'

export type FlakeType = 'text' | 'image' | 'code'

export const FlakeThemes = ['default'] as const

export type FlakeTheme = typeof FlakeThemes[number]

export interface Flake {
  id: string
  createdAt: number
  modifiedAt: number
  theme: FlakeTheme
  name: string
  type: FlakeType
  content: string
  imageOnly: boolean
  enableRatio: boolean
  ratio: number | ''
  codeLang: string
  codeWrap: boolean
  labels: string[]
}

export const createFlake = (): Flake => {
  return {
    id: nanoid(16),
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    theme: 'default',
    name: 'New Flake',
    type: 'text',
    content: '',
    imageOnly: false,
    enableRatio: false,
    ratio: 1,
    codeLang: '',
    codeWrap: false,
    labels: [],
  }
}

export const FlakeLabelColors = ['none'] as const

export type FlakeLabelColor = typeof FlakeLabelColors[number]

export interface FlakeLabel {
  id: string
  createdAt: number
  name: string
  color: FlakeLabelColor
  listed: boolean
  filter: boolean
}

export const createLabel = (): FlakeLabel => {
  return {
    id: nanoid(8),
    createdAt: Date.now(),
    name: '',
    color: 'none',
    listed: true,
    filter: false,
  }
}

export type PileFlow = 'vertical' | 'horizontal'

export type PileAdaptiveFlow = PileFlow | 'mobile'

export type SortCondition = 'name' | 'createdAt' | 'modifiedAt'

export type SortOrder = 'asc' | 'desc'

export interface Flakepile {
  id: string
  flow: PileFlow
  sortBy: SortCondition
  sortOrder: SortOrder
  width: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
  filterInvert: boolean
  labels: FlakeLabel[]
  flakes: Flake[]
}

export const createFlakepile = (): Flakepile => {
  return {
    id: nanoid(16),
    flow: 'horizontal',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    width: 1,
    elasticWidth: false,
    enableMaxHeight: false,
    maxHeight: 1,
    elasticHeight: false,
    filterInvert: false,
    labels: [],
    flakes: [],
  }
}

export type EditingRef = Ref<string | null>

export type IsDevRef = Ref<boolean>
