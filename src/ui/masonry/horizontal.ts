import type { Flake, FlakepileMeta } from '@/schemes/v1'
import type { Size } from '@/utils'
import { type ComputedMasonry, design, setupComputedMasonry } from './entry'

export function computeHorizontalMasonry(
  flakes: Flake[],
  meta: FlakepileMeta,
  usableSize: Size,
): ComputedMasonry {
  const computed = setupComputedMasonry()

  const width = meta.width
  const usableHeight = usableSize.height - 2 * design.pad.y
  let maxHeight = usableHeight

  if (meta.enableMaxHeight) {
    maxHeight = meta.maxHeight
    if (maxHeight > usableHeight) {
      maxHeight = usableHeight
    }
  }

  let column = 0
  let columnHeight = 0

  interface StashItem {
    id: string
    height: number
    overflow: boolean
    allocated: number
  }

  let stash: StashItem[] = []

  const consumeStash = () => {
    let leftover = usableHeight - columnHeight + design.gap.y

    // Allocate leftover space to each flake.
    do {
      // Find how many flakes are overflowed.
      let nOverflowed = 0
      let shortestHeight = Infinity
      let shortestIntex = 0

      for (let i = 0; i < stash.length; i++) {
        const item = stash[i]!

        if (item.overflow) {
          nOverflowed++
          if (item.height < shortestHeight) {
            shortestHeight = item.height
            shortestIntex = i
          }
        }
      }

      // If no overflows, end process.
      if (nOverflowed === 0) break

      // Get how many space each overflowed flake can have.
      const leftoverEach = leftover / nOverflowed
      const smallestOverflow = shortestHeight - stash[shortestIntex]!.allocated

      // If the least overflowed flake cannot be fully expanded
      // by allocating leftover space:
      if (leftoverEach <= smallestOverflow) {
        for (const item of stash) {
          if (item.overflow) {
            item.allocated += leftoverEach
          }
        }

        leftover = 0
      } // Else, go into the next round.
      else {
        for (const item of stash) {
          item.allocated += smallestOverflow
        }

        stash[shortestIntex]!.overflow = false
        leftover -= smallestOverflow * nOverflowed
      }
    } while (leftover > 0)

    let accumulatedHeight = 0

    for (let i = 0; i < stash.length; i++) {
      const x = design.pad.x + (width + design.gap.x) * column
      const y = design.pad.y + accumulatedHeight
      const stashId = stash[i]!.id
      const allocated = stash[i]!.allocated

      computed.rects.set(stashId, {
        x,
        y,
        width,
        height: allocated,
      })

      accumulatedHeight += allocated + design.gap.y
    }

    stash = []
  }

  for (const flake of flakes) {
    const id = flake.id
    const height = flake.cache.height
    if (height === 0) continue

    const actualHeight = height > maxHeight ? maxHeight : height
    const isColumnFull = columnHeight + actualHeight > usableHeight

    if (meta.elasticHeight) {
      if (columnHeight > 0 && isColumnFull) {
        consumeStash()

        column++
        columnHeight = 0
      }

      stash.push({
        id: flake.id,
        height: height,
        overflow: height > maxHeight,
        allocated: actualHeight,
      })
    } else {
      if (columnHeight > 0 && isColumnFull) {
        column++
        columnHeight = 0
      }

      const x = design.pad.x + (width + design.gap.x) * column
      const y = design.pad.y + columnHeight

      computed.rects.set(id, {
        x,
        y,
        width,
        height: actualHeight,
      })
    }

    columnHeight += actualHeight + design.gap.y
  }

  if (meta.elasticHeight && stash.length > 0) {
    consumeStash()
  }

  computed.size.width = design.pad.x * 2
    + width * (column + 1)
    + design.gap.x * (column + 2)
  computed.size.height = usableSize.height

  return computed
}
