import type { Flake, FlakepileMeta } from '@/schemes/v1'
import type { Size } from '@/utils'
import { type ComputedMasonry, design, setupComputedMasonry } from './entry'

export function computeMobileMasonry(
  flakes: Flake[],
  _meta: FlakepileMeta,
  usableSize: Size,
): ComputedMasonry {
  const computed = setupComputedMasonry()

  const width = usableSize.width - 2 * design.pad.x
  let columnHeight = 0

  for (const flake of flakes) {
    if (flake.cache.height === 0) continue

    const id = flake.id
    const height = flake.cache.height

    computed.rects.set(id, {
      x: design.pad.x,
      y: design.pad.y + columnHeight,
      width,
      height,
    })

    columnHeight += height + design.gap.y
  }

  computed.size.width = usableSize.width
  computed.size.height = columnHeight + design.gap.y + 2 * design.pad.y + 80

  return computed
}
