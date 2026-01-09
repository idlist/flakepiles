import {
  createStyledMasonry, FLAKE_UNIT, GAP_X, GAP_Y, px,
  type ResolveMasonryOptions, type StyledMasonry,
} from './masonry-common'
import type { Flake } from '@/data'

export const resolveMasonryHorizontal = (
  flakes: Flake[], // For the ID order of the flakes.
  heightMap: Map<string, number>,
  options: ResolveMasonryOptions,
): StyledMasonry => {
  const styled = createStyledMasonry()

  const width = FLAKE_UNIT * options.width
  let maxHeight = options.masonryHeight

  if (options.enableMaxHeight) {
    maxHeight = FLAKE_UNIT * options.maxHeight
    if (maxHeight > options.masonryHeight) {
      maxHeight = options.masonryHeight
    }
  }

  let column = 0
  let columnHeight = 0

  for (const flake of flakes) {
    const id = flake.id
    const height = heightMap.get(id)!

    if (columnHeight > 0 && columnHeight + height > options.masonryHeight) {
      column++
      columnHeight = 0
    }

    styled.outer.set(id, {
      top: px(columnHeight),
      left: px((width + GAP_X) * column),
      width: px(width),
    })

    styled.inner.set(id, {
      maxHeight: px(maxHeight),
    })

    if (height > maxHeight) {
      columnHeight += maxHeight
    }
    else {
      columnHeight += height
    }

    columnHeight += GAP_Y
  }

  styled.mansory.width = px(width * (column + 1) + GAP_X * column)
  styled.mansory.height = px(options.masonryHeight)

  return styled
}
