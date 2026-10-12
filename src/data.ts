import { nanoid } from 'nanoid'
import type { Ref } from 'vue'

/** @deprecated */
export type FlakeType = 'text' | 'image' | 'code'

/** @deprecated */
export const FlakeThemes = ['default'] as const

/** @deprecated */
export type FlakeTheme = typeof FlakeThemes[number]

/** @deprecated */
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

/** @deprecated */
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

/** @deprecated */
export const FlakeLabelColors = ['none'] as const

/** @deprecated */
export type FlakeLabelColor = typeof FlakeLabelColors[number]

/** @deprecated */
export interface FlakeLabel {
  id: string
  createdAt: number
  name: string
  color: FlakeLabelColor
  listed: boolean
  filter: boolean
}

/** @deprecated */
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

/** @deprecated */
export type PileFlow = 'vertical' | 'horizontal'

/** @deprecated */
export type PileAdaptiveFlow = PileFlow | 'mobile'

/** @deprecated */
export type SortCondition = 'name' | 'createdAt' | 'modifiedAt'

/** @deprecated */
export type SortOrder = 'asc' | 'desc'

/** @deprecated */
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

/** @deprecated */
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

/** @deprecated */
export type EditingRef = Ref<string | null>

/** @deprecated */
export type IsDevRef = Ref<boolean>
