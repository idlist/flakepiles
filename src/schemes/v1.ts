import { nanoid } from 'nanoid'
import type { WithVersion } from './common'

export interface FlakeMeta {
  createdAt: number
  modifiedAt: number
  pinned: boolean
  textWrap: boolean
}

export interface Flake extends WithVersion {
  id: string
  meta: FlakeMeta
  labels: string[]
  content: string
}

export function createFlake(): Flake {
  return {
    version: 1,
    id: nanoid(16),
    meta: {
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      pinned: false,
      textWrap: true,
    },
    labels: [],
    content: '',
  }
}

export const FlakeLabelColors = [
  'none',
] as const

export type FlakeLabelColor = typeof FlakeLabelColors[number]

export interface FlakeLabel extends WithVersion {
  id: string
  name: string
  color: FlakeLabelColor
  shortened: boolean
  filtered: boolean
}

export function createFlakeLabel(): FlakeLabel {
  return {
    version: 1,
    id: nanoid(8),
    name: '',
    color: 'none',
    shortened: false,
    filtered: false,
  }
}

export type FlakepileMenuState = 'default' | 'shrinked' | 'expanded'

export type FlakepileFlow = 'vertical' | 'horizontal'

export type FlakepileAdaptiveFlow = FlakepileFlow | 'mobile'

export type SortCondition = 'createdAt' | 'modifiedAt' | 'content'

export type SortOrder = 'asc' | 'desc'

export interface FlakepileMeta {
  menu: FlakepileMenuState
  flow: FlakepileFlow
  sortBy: SortCondition
  sortOrder: SortOrder
  width: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
  showTags: boolean
  showTimes: boolean
  directDelete: boolean
}

export interface Flakepile extends WithVersion {
  id: string
  meta: FlakepileMeta
  labels: FlakeLabel[]
  flakes: Flake[]
}

export function createFlakepile(): Flakepile {
  return {
    version: 1,
    id: nanoid(16),
    meta: {
      menu: 'default',
      flow: 'horizontal',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      width: 240,
      elasticWidth: false,
      enableMaxHeight: false,
      maxHeight: 400,
      elasticHeight: false,
      showTags: true,
      showTimes: false,
      directDelete: false,
    },
    labels: [],
    flakes: [],
  }
}

export type HeightCacheCollection = Record<string, HeightCache>

export interface HeightCache extends WithVersion {
  heights: HeightRecord
}

export type HeightRecord = Record<string, number>

export function createHeightCache(): HeightCache {
  return {
    version: 1,
    heights: {},
  }
}
