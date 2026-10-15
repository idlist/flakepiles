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

export const flakeLabelColors = [
  'none',
] as const

export type FlakeLabelColor = typeof flakeLabelColors[number]

export interface FlakeLabel extends WithVersion {
  id: string
  name: string
  color: FlakeLabelColor
  collapsed: boolean
  filtered: boolean
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
  showLabels: boolean
  showTimes: boolean
  directDelete: boolean
}

export interface Flakepile extends WithVersion {
  id: string
  meta: FlakepileMeta
  labels: FlakeLabel[]
  flakes: Flake[]
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
