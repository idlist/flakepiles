import { nanoid } from 'nanoid'

export interface FlakeMeta {
  createdAt: number
  modifiedAt: number
  pinned: boolean
}

export interface FlakeCache {
  width: number
  height: number
}

export interface Flake {
  id: string
  meta: FlakeMeta
  cache: FlakeCache
  labels: string[]
  content: string
}

export function createFlake(): Flake {
  return {
    id: nanoid(16),
    meta: {
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      pinned: false,
    },
    cache: {
      width: 0,
      height: 0,
    },
    labels: [],
    content: '',
  }
}

export const FlakeLabelColors = [
  'none',
] as const

export type FlakeLabelColor = typeof FlakeLabelColors[number]

export interface FlakeLabel {
  id: string
  name: string
  color: FlakeLabelColor
  shortened: boolean
  filtered: boolean
}

export function createFlakeLabel(): FlakeLabel {
  return {
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

export type SortCondition = 'name' | 'createdAt' | 'modifiedAt'

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
}

export interface Flakepile {
  id: string
  meta: FlakepileMeta
  labels: FlakeLabel[]
  flakes: Flake[]
}

export function createFlakepile(): Flakepile {
  return {
    id: nanoid(16),
    meta: {
      menu: 'default',
      flow: 'horizontal',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      width: 1,
      elasticWidth: false,
      enableMaxHeight: false,
      maxHeight: 1,
      elasticHeight: false,
    },
    labels: [],
    flakes: [],
  }
}
