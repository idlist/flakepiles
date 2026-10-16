import { nanoid } from 'nanoid'
import { type FlakepilePreV1, updateFromPreToV1 } from './pre'
import type { Flake, FlakeLabel, Flakepile, HeightCache } from './v1'

export interface WithVersion {
  version: number
}

export function parseFlakepile(raw: string): Flakepile {
  let parsed = JSON.parse(raw) as FlakepilePreV1 | Flakepile

  // Data without a version comes pre-v1 version.
  if (!('version' in parsed)) {
    parsed = updateFromPreToV1(parsed)
  }

  return parsed
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

export function createFlakeLabel(): FlakeLabel {
  return {
    version: 1,
    id: nanoid(8),
    name: '',
    color: 'none',
    collapsed: false,
    filteredOut: false,
  }
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
      width: 280,
      elasticWidth: false,
      enableMaxHeight: false,
      maxHeight: 400,
      elasticHeight: false,
      showLabels: true,
      showTimes: false,
      directDelete: false,
      disableLabelFiltering: false,
    },
    labels: [],
    flakes: [],
  }
}

export function createHeightCache(): HeightCache {
  return {
    version: 1,
    heights: {},
  }
}

export { flakeLabelColors } from './v1'

export type {
  Flake,
  FlakeLabel,
  FlakeLabelColor,
  FlakeMeta,
  Flakepile,
  FlakepileAdaptiveFlow,
  FlakepileFlow,
  FlakepileMenuState,
  FlakepileMeta,
  HeightCache,
  HeightCacheCollection,
  HeightRecord,
  SortCondition,
  SortOrder,
} from './v1'
