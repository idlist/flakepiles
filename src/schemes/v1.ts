import { nanoid } from 'nanoid'
import type { WithVersion } from './common'

export interface FlakeMeta {
  createdAt: number
  modifiedAt: number
  pinned: boolean
  textWrap: boolean
  desiredHeight: number
}

export interface FlakeCache {
  width: number
  height: number
}

export interface Flake extends WithVersion {
  id: string
  meta: FlakeMeta
  cache: FlakeCache
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
      desiredHeight: 0,
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
      showTimes: false,
      directDelete: false,
    },
    labels: [],
    flakes: [],
  }
}
