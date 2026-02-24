import type { Flake, SortCondition, SortOrder } from '@/data'
import { prepareFuzzySearch, prepareSimpleSearch } from 'obsidian'

/** Filter flakes based on search queue */
export const searchFlakes = (flakes: Flake[], query: string): Flake[] => {
  query = query.trim()
  if (!query) return flakes

  const fuzzySearch = prepareFuzzySearch(query)
  const simpleSearch = prepareSimpleSearch(query)

  return flakes.filter((flake) => {
    const nameResult = fuzzySearch(flake.name)
    const nameMatched = !!nameResult

    if (!nameMatched && flake.type == 'image') {
      return false
    }

    const contentResult = simpleSearch(flake.content)
    const contentMatched = !!contentResult

    return nameMatched || contentMatched
  })
}

/** In-place sorting of flakes. */
export const sortFlakes = (flakes: Flake[], sortBy: SortCondition, sortOrder: SortOrder) => {
  flakes.sort((a, b) => {
    if (sortBy == 'name') {
      if (sortOrder == 'asc') {
        return a.name.localeCompare(b.name)
      }
      else if (sortOrder == 'desc') {
        return b.name.localeCompare(a.name)
      }
    }
    else if (sortBy == 'createdAt') {
      if (sortOrder == 'asc') {
        return a.createdAt - b.createdAt
      }
      else if (sortOrder == 'desc') {
        return b.createdAt - a.createdAt
      }
    }
    else if (sortBy == 'modifiedAt') {
      if (sortOrder == 'asc') {
        return a.modifiedAt - b.modifiedAt
      }
      else if (sortOrder == 'desc') {
        return b.modifiedAt - a.modifiedAt
      }
    }
    return 0
  })
}
