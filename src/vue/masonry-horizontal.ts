import {
  createStyledMasonry, FLAKE_UNIT, GAP_X, GAP_Y, PAD_X, PAD_Y,
  type MasonryOptions, type ResolvedMasonry,
} from './masonry-common'
import type { Flake } from '@/data'

export const resolveMasonryHorizontal = (
  flakes: Flake[], // For the ID order of the flakes.
  heightMap: Map<string, number>,
  options: MasonryOptions,
): ResolvedMasonry => {
  const styled = createStyledMasonry()

  const width = FLAKE_UNIT * options.width
  const usableHeight = options.canvasHeight - 2 * PAD_Y
  let maxHeight = usableHeight

  if (options.enableMaxHeight) {
    maxHeight = FLAKE_UNIT * options.maxHeight
    if (maxHeight > usableHeight) {
      maxHeight = usableHeight
    }
  }

  let column = 0
  let columnHeight = 0

  interface Shash {
    id: string
    height: number
    overflow: boolean
    allocated: number
  }

  let stashes: Shash[] = []

  const consumeStashes = () => {
    let leftover = usableHeight - columnHeight + GAP_Y

    // Space allcation process.
    do {
      // Find how many flakes are overflowed.
      let overflowed = 0
      let leastHeight = Number.MAX_VALUE
      let leastHeightIndex = 0

      for (let i = 0; i < stashes.length; i++) {
        const stash = stashes[i]!

        if (stash.overflow) {
          overflowed++
          if (stash.height < leastHeight) {
            leastHeight = stash.height
            leastHeightIndex = i
          }
        }
      }

      // If no overflows, end process.
      if (!overflowed) break

      // Get how many space each overflowed flake can have.
      const l = leastHeightIndex
      const leftoverEach = leftover / overflowed
      const leastOverflow = leastHeight - stashes[l]!.allocated

      // If the least overflowed flake cannot be fully expanded
      // by allocating leftover space:
      if (leftoverEach <= leastOverflow) {
        for (const stash of stashes) {
          if (stash.overflow) {
            stash.allocated += leftoverEach
          }
        }

        leftover = 0
      }
      // Else, go into the next round.
      else {
        for (const stash of stashes) {
          stash.allocated += leastOverflow
        }

        stashes[l]!.overflow = false
        leftover -= leastOverflow * overflowed
      }
    } while (leftover > 0)

    let accumulatedHeight = 0

    for (let i = 0; i < stashes.length; i++) {
      const x = PAD_X + (width + GAP_X) * column
      const y = PAD_Y + accumulatedHeight
      const stashId = stashes[i]!.id
      const allocated = stashes[i]!.allocated

      styled.rects.set(stashId, {
        x,
        y,
        width,
        height: allocated,
      })

      accumulatedHeight += allocated + GAP_Y
    }

    stashes = []
  }

  for (const flake of flakes) {
    const id = flake.id
    const height = heightMap.get(id)
    if (!height) continue

    styled.flakes.add(id)
    const actualHeight = height > maxHeight ? maxHeight : height

    if (columnHeight > 0 && columnHeight + actualHeight > usableHeight) {
      if (options.elasticHeight) {
        consumeStashes()
      }

      column++
      columnHeight = 0
    }

    if (options.elasticHeight) {
      stashes.push({
        id: flake.id,
        height: height,
        overflow: height > maxHeight,
        allocated: actualHeight,
      })
    }
    else {
      const x = PAD_X + (width + GAP_X) * column
      const y = PAD_Y + columnHeight

      styled.rects.set(id, {
        x,
        y,
        width,
        height: actualHeight,
      })
    }

    columnHeight += actualHeight + GAP_Y
  }

  if (options.elasticHeight) {
    consumeStashes()
  }

  const expandedWidth = PAD_X * 2 + width * (column + 1) + GAP_X * (column + 2)
  styled.masonry.width = expandedWidth
  styled.masonry.height = options.canvasHeight

  return styled
}
