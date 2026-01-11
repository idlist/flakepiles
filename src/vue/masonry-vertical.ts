import { createArray } from '@rewl/kit'
import {
  createStyledMasonry, FLAKE_UNIT, GAP_X, GAP_Y, PAD_X, PAD_Y,
  type MasonryOptions, type ResolvedMasonry,
} from './masonry-common'
import type { Flake } from '@/data'

const getBasis = (options: MasonryOptions) => {
  let width = FLAKE_UNIT * options.width
  const usableWidth = options.canvasWidth - 2 * PAD_X
  let column: number = 1

  if (width >= usableWidth) {
    width = usableWidth
  }
  else if (options.elasticWidth) {
    column = (usableWidth + GAP_X) / (width + GAP_X)
    column = Math.max(Math.floor(column), 1)
    width = (usableWidth - GAP_X * (column - 1)) / column
  }
  else {
    column = (usableWidth + GAP_X) / (width + GAP_X)
    column = Math.max(Math.floor(column), 1)
  }

  return { width, column }
}

export const resolveMasonryVertical = (
  flakes: Flake[], // For the ID order of the flakes.
  heightMap: Map<string, number>,
  options: MasonryOptions,
): ResolvedMasonry => {
  const styled = createStyledMasonry()

  const { width, column } = getBasis(options)
  const columns = createArray(column, 0)
  const maxHeight = FLAKE_UNIT * options.maxHeight

  const columnCenter = column / 2
  const masonryCenter = options.canvasWidth / 2

  const findColumn = (type: 'shortest' | 'longest') => {
    let foundHeight = 0
    let foundColumn = 0

    if (type == 'shortest') {
      foundHeight = Number.MAX_VALUE
    }
    else if (type == 'longest') {
      foundHeight = Number.MIN_VALUE
    }

    for (let i = 0; i < columns.length; i++) {
      if (type == 'shortest' && columns[i]! < foundHeight) {
        foundHeight = columns[i]!
        foundColumn = i
      }
      else if (type == 'longest' && columns[i]! > foundHeight) {
        foundHeight = columns[i]!
        foundColumn = i
      }
    }

    return { foundColumn, foundHeight }
  }

  for (const flake of flakes) {
    const id = flake.id
    const height = heightMap.get(id)
    if (!height) continue

    styled.flakes.add(id)
    const { foundColumn, foundHeight } = findColumn('shortest')

    const x = masonryCenter
      + (foundColumn - columnCenter) * width
      + (foundColumn - columnCenter + 0.5) * GAP_X
    const y = PAD_Y + foundHeight

    let actualHeight = height
    if (options.enableMaxHeight && height > maxHeight) {
      actualHeight = maxHeight
    }

    styled.rects.set(id, {
      x,
      y,
      width,
      height: actualHeight,
    })

    columns[foundColumn]! += actualHeight + GAP_Y
  }

  const { foundHeight } = findColumn('longest')
  styled.masonry.width = options.canvasWidth
  styled.masonry.height = foundHeight + GAP_Y + 2 * PAD_Y

  return styled
}
