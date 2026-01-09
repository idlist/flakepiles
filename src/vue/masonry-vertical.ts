import { createArray } from '@rewl/kit'
import {
  createStyledMasonry, FLAKE_UNIT, GAP_X, GAP_Y, px,
  type ResolveMasonryOptions, type StyledMasonry,
} from './masonry-common'
import type { Flake } from '@/data'

const getBasis = (options: ResolveMasonryOptions) => {
  let width = FLAKE_UNIT * options.width
  let column: number = 1

  if (width >= options.masonryWidth) {
    width = options.masonryWidth
  }
  else if (options.elasticWidth) {
    column = (options.masonryWidth + GAP_X) / (width + GAP_X)
    column = Math.max(Math.floor(column), 1)
    width = (options.masonryWidth - GAP_X * (column - 1)) / column
  }
  else {
    column = (options.masonryWidth + GAP_X) / (width + GAP_X)
    column = Math.max(Math.floor(column), 1)
  }

  return { width, column }
}

export const resolveMasonryVertical = (
  flakes: Flake[], // For the ID order of the flakes.
  heightMap: Map<string, number>,
  options: ResolveMasonryOptions,
): StyledMasonry => {
  const styled = createStyledMasonry()

  const { width, column } = getBasis(options)
  const columns = createArray(column, 0)
  const maxHeight = FLAKE_UNIT * options.maxHeight

  const columnCenter = column / 2
  const masonryCenter = options.masonryWidth / 2

  const getLeft = (column: number) => {
    return masonryCenter
      + (column - columnCenter) * width
      + (column - columnCenter + 0.5) * GAP_X
  }

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
    const height = heightMap.get(id)!

    const { foundColumn, foundHeight } = findColumn('shortest')

    styled.outer.set(id, {
      top: px(foundHeight),
      left: px(getLeft(foundColumn)),
      width: px(width),
    })

    if (options.enableMaxHeight) {
      styled.inner.set(id, {
        maxHeight: px(maxHeight),
      })

      if (height > maxHeight) {
        columns[foundColumn]! += maxHeight
      } else {
        columns[foundColumn]! += height
      }
    }
    else {
      columns[foundColumn]! += height
    }

    columns[foundColumn]! += GAP_Y
  }

  const { foundHeight } = findColumn('longest')
  styled.mansory.width = px(options.masonryWidth)
  styled.mansory.height = px(foundHeight - GAP_Y)

  return styled
}
