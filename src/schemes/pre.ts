import type { Flake, FlakeLabel, Flakepile, SortCondition } from './v1'

interface FlakePreV1 {
  id: string
  createdAt: number
  modifiedAt: number
  theme: 'default'
  name: string
  type: 'text' | 'image' | 'code'
  content: string
  imageOnly: boolean
  enableRatio: boolean
  ratio: number | ''
  codeLang: string
  codeWrap: boolean
  labels: string[]
}

interface FlakeLabelPreV1 {
  id: string
  createdAt: number
  name: string
  color: 'none'
  listed: boolean
  filter: boolean
}

export interface FlakepilePreV1 {
  id: string
  flow: 'vertical' | 'horizontal'
  sortBy: 'name' | 'createdAt' | 'modifiedAt'
  sortOrder: 'asc' | 'desc'
  width: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
  filterInvert: boolean
  labels: FlakeLabelPreV1[]
  flakes: FlakePreV1[]
}

const sortByFromPre: Record<FlakepilePreV1['sortBy'], SortCondition> = {
  name: 'content',
  createdAt: 'createdAt',
  modifiedAt: 'modifiedAt',
}

export function updateFromPreToV1(old: FlakepilePreV1): Flakepile {
  const labels: FlakeLabel[] = old.labels.map((label) => ({
    version: 1,
    id: label.id,
    name: label.name,
    color: label.color,
    collapsed: !label.listed,
    filteredOut: label.filter,
  }))

  const flakes: Flake[] = old.flakes.map((flake) => ({
    version: 1,
    id: flake.id,
    meta: {
      createdAt: flake.createdAt,
      modifiedAt: flake.modifiedAt,
      pinned: false,
      textWrap: true,
    },
    labels: flake.labels,
    content: `## ${flake.name}\n\n${flake.content}`,
  }))

  return {
    version: 1,
    id: old.id,
    meta: {
      menu: 'default',
      flow: old.flow,
      sortBy: sortByFromPre[old.sortBy],
      sortOrder: old.sortOrder,
      width: old.width * 280,
      elasticWidth: old.elasticWidth,
      enableMaxHeight: old.enableMaxHeight,
      maxHeight: old.maxHeight * 280,
      elasticHeight: old.elasticHeight,
      showLabels: true,
      showTimes: false,
      directDelete: false,
      disableLabelFiltering: false,
    },
    labels,
    flakes,
  }
}
