import type { Flake, FlakepileMeta } from '@/schemes/v1'
import type { Size } from '@/utils'
import { createArray } from '@rewl/kit'
import { type ComputedMasonry, design, setupComputedMasonry } from './entry'

export function computeVerticalBase(
  meta: FlakepileMeta,
  usableSize: Size,
) {
  let width = meta.width
  const usableWidth = usableSize.width - 2 * design.pad.x
  let column: number = 1

  if (meta.width >= usableWidth) {
    width = usableWidth
  } else {
    column = (usableWidth + design.gap.x) / (width + design.gap.x)
    column = Math.max(Math.floor(column), 1)

    if (meta.elasticWidth) {
      width = (usableWidth - design.gap.x * (column - 1)) / column
    }
  }

  return { width, column }
}

export function computeVerticalMasonry(
  flakes: Flake[],
  meta: FlakepileMeta,
  usableSize: Size,
): ComputedMasonry {
  const computed = setupComputedMasonry()

  const { width, column } = computeVerticalBase(meta, usableSize)
  const columns = createArray(column, 0)

  const centerColumn = column / 2
  const masonryCenter = usableSize.width / 2

  const findShortestColumn = () => {
    let foundHeight = Infinity
    let foundColumn = 0

    for (let i = 0; i < columns.length; i++) {
      if (columns[i]! < foundHeight) {
        foundHeight = columns[i]!
        foundColumn = i
      }
    }

    return { foundColumn, foundHeight }
  }

  const findLongestColumn = () => {
    let foundHeight = -Infinity
    let foundColumn = 0

    for (let i = 0; i < columns.length; i++) {
      if (columns[i]! > foundHeight) {
        foundHeight = columns[i]!
        foundColumn = i
      }
    }

    return { foundColumn, foundHeight }
  }

  for (const flake of flakes) {
    const id = flake.id
    const height = flake.cache.height
    if (!height) continue

    const { foundColumn, foundHeight } = findShortestColumn()

    const x = masonryCenter
      + (foundColumn - centerColumn) * width
      + (foundColumn - centerColumn + 0.5) * design.gap.x
    const y = design.pad.y + foundHeight

    let actualHeight = height
    if (meta.enableMaxHeight && height > meta.maxHeight) {
      actualHeight = meta.maxHeight
    }

    computed.rects.set(id, {
      x,
      y,
      width,
      height: actualHeight,
    })

    columns[foundColumn]! += actualHeight + design.gap.y
  }

  const { foundHeight } = findLongestColumn()
  computed.size.width = usableSize.width
  computed.size.height = foundHeight + design.gap.y + 2 * design.pad.y

  return computed
}
