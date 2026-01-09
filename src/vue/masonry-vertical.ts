import {
  createStyledMasonry, FLAKE_WIDTH as FLAKE_UNIT,
  type Flake, type ResolveMasonryOptions, type StyledMasonry,
} from '@/data'
import { createArray } from '@rewl/kit'

export const GAP_X = 12
export const GAP_Y = 12

const px = (value: number) => `${value}px`

const calculateBasis = (options: ResolveMasonryOptions) => {
  let width = FLAKE_UNIT * options.width
  let column: number

  if (width >= options.masonryWidth) {
    width = options.masonryWidth
    column = 1
  }
  else if (options.elasticWidth) {
    column = (options.masonryWidth + GAP_X) / (width + GAP_X)
    column = Math.max(Math.floor(column), 1)
    width = (options.masonryWidth - GAP_X * (column - 1)) / column
  }
  else {
    column = Math.max(Math.floor(options.masonryWidth / width), 1)
  }

  return { width, column }
}

export const resolveVerticalMasonry = (
  flakes: Flake[], // Get the order of the flakes.
  heightMap: Map<string, number>,
  options: ResolveMasonryOptions,
): StyledMasonry => {
  const styled = createStyledMasonry()
  const { width, column } = calculateBasis(options)
  const columns = createArray(column, 0)
  const maxHeight = FLAKE_UNIT * options.maxHeight

  const columnCenter = column / 2
  const masonryCenter = options.masonryWidth / 2

  const getLeft = (column: number) => {
    return masonryCenter
      + (column - columnCenter) * width
      + (column - columnCenter + 0.5) * GAP_X
  }

  for (const flake of flakes) {
    const id = flake.id
    const height = heightMap.get(id)!

    let shortestHeight = Number.MAX_VALUE
    let shortestColumn = 0

    for (let i = 0; i < columns.length; i++) {
      if (columns[i]! < shortestHeight) {
        shortestHeight = columns[i]!
        shortestColumn = i
      }
    }

    styled.outer.set(id, {
      top: px(shortestHeight),
      left: px(getLeft(shortestColumn)),
      width: px(width),
    })

    if (options.enableMaxHeight) {
      styled.inner.set(id, {
        maxHeight: px(maxHeight),
      })

      if (height > maxHeight) {
        columns[shortestColumn]! += maxHeight
      } else {
        columns[shortestColumn]! += height
      }
    }
    else {
      columns[shortestColumn]! += height
    }

    columns[shortestColumn]! += GAP_Y
  }

  return styled
}
