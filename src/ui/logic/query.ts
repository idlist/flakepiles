import type { Flake, FlakeLabel, FlakepileMeta } from '@/schemes/common'
import { prepareSimpleSearch } from 'obsidian'

const headingPattern = /^ {0,3}(#{1,6})(?=[ \t]|$)/

type FlakeComparator = (a: Flake, b: Flake) => number

function tryGetHeadingLevel(content: string): number | null {
  const firstLf = content.indexOf('\n')
  const firstLine = firstLf === -1 ? content : content.slice(0, firstLf)
  return headingPattern.exec(firstLine)?.[1]?.length ?? null
}

const contentComparator: FlakeComparator = (a, b) => {
  // Empty Flakes come last.
  const aIsEmpty = a.content.trim() === ''
  const bIsEmpty = b.content.trim() === ''

  if (aIsEmpty && bIsEmpty) return 0
  if (aIsEmpty) return 1
  if (bIsEmpty) return -1

  // Flakes with a heading come before the ones without a heading.
  // Flake with a higher-level heading comes first.
  const aHeadingLevel = tryGetHeadingLevel(a.content) ?? 7
  const bHeadingLevel = tryGetHeadingLevel(b.content) ?? 7

  if (aHeadingLevel !== bHeadingLevel) {
    return aHeadingLevel - bHeadingLevel
  }

  // Fall back to normal comparing method.
  const stringCompared = a.content.localeCompare(b.content)
  if (stringCompared !== 0) return stringCompared
  return a.meta.createdAt - b.meta.createdAt
}

function getFlakeComparator(meta: FlakepileMeta): FlakeComparator {
  if (meta.sortBy === 'createdAt') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.meta.createdAt - b.meta.createdAt
    } else {
      return (a, b) => b.meta.createdAt - a.meta.createdAt
    }
  } else if (meta.sortBy === 'modifiedAt') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => a.meta.modifiedAt - b.meta.modifiedAt
    } else {
      return (a, b) => b.meta.modifiedAt - a.meta.modifiedAt
    }
  } else if (meta.sortBy === 'content') {
    if (meta.sortOrder === 'asc') {
      return (a, b) => contentComparator(a, b)
    } else {
      return (a, b) => contentComparator(b, a)
    }
  }
  return () => 0
}

type MaybeSimpleSearch = ReturnType<typeof prepareSimpleSearch> | null

function preprocessQuery(query: string) {
  const tokens = query.split(/\s+/).filter((t) => !!t)
  const contentQuery: string[] = []
  const labelQuery: string[] = []

  for (const token of tokens) {
    if (token.startsWith('\\@')) {
      const unescaped = token.slice(1)
      contentQuery.push(unescaped)
    } else if (token.startsWith('@label:')) {
      const label = token.slice(7)

      if (label !== '') {
        labelQuery.push(label)
      } else {
        contentQuery.push(token)
      }
    } else {
      contentQuery.push(token)
    }
  }

  return {
    contentQuery: contentQuery.join(' '),
    labelQuery: labelQuery.join(' '),
  }
}

export function arrangeFlakes(
  flakes: Flake[],
  meta: FlakepileMeta,
  labels: Map<string, FlakeLabel>,
  query: string,
): Flake[] {
  const { contentQuery, labelQuery } = preprocessQuery(query)

  let contentSearch: MaybeSimpleSearch = null
  if (contentQuery !== '') contentSearch = prepareSimpleSearch(contentQuery)

  let labelSearch: MaybeSimpleSearch = null
  if (labelQuery !== '') labelSearch = prepareSimpleSearch(labelQuery)

  const filtered = flakes.filter((flake) => {
    if (labelSearch && flake.labels.length === 0) {
      return false
    }

    for (const labelId of flake.labels) {
      const label = labels.get(labelId)
      if (!label) continue
      if (label.filteredOut) return false

      if (labelSearch) {
        const result = labelSearch(label.name)
        if (result == null) return false
      }
    }

    if (contentSearch) {
      const result = contentSearch(flake.content)
      if (result == null) return false
    }

    return true
  })

  if (filtered.length === 0) return filtered

  const pinned = filtered.filter((flake) => flake.meta.pinned)
  const notPinned = filtered.filter((flake) => !flake.meta.pinned)
  const comparator = getFlakeComparator(meta)

  pinned.sort(comparator)
  notPinned.sort(comparator)
  const merged = [...pinned, ...notPinned]

  return merged
}
