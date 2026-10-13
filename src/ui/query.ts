import type { Flake, FlakepileMeta } from '@/schemes/v1'
import { prepareSimpleSearch } from 'obsidian'

type FlakeComparator = (a: Flake, b: Flake) => number

export function getFlakeComparator(meta: FlakepileMeta): FlakeComparator {
  if (meta.sortBy === 'createdAt') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.meta.createdAt - b.meta.createdAt
    } else {
      return (a, b) => b.meta.createdAt - a.meta.createdAt
    }
  }
  if (meta.sortBy === 'modifiedAt') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.meta.modifiedAt - b.meta.modifiedAt
    } else {
      return (a, b) => b.meta.modifiedAt - a.meta.modifiedAt
    }
  }

  // TODO: Maybe take title (first line) into consideration
  if (meta.sortBy === 'content') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.content.localeCompare(b.content)
    } else {
      return (a, b) => b.content.localeCompare(a.content)
    }
  }

  return () => 0
}

export function queryFlakes(flakes: Flake[], query: string): Flake[] {
  query = query.trim()
  if (query === '') return [...flakes] // Retain immutability.

  const simpleSearch = prepareSimpleSearch(query)

  const filtered = flakes.filter((flake) => {
    const result = simpleSearch(flake.content)
    const hasMatch = result != null

    return hasMatch
  })

  return filtered
}
