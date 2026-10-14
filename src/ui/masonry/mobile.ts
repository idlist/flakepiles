import { type ComputedMasonry, type ComputeMasonryRequirements, design, setupComputedMasonry } from './entry'

export function computeMobileMasonry(
  required: ComputeMasonryRequirements,
): ComputedMasonry {
  const { ids, heights, usableSize } = required
  const computed = setupComputedMasonry()

  const width = usableSize.width - 2 * design.pad.x
  let columnHeight = 0

  for (const id of ids) {
    const height = heights[id]
    if (!height) continue

    computed.rects.set(id, {
      x: design.pad.x,
      y: design.pad.y + columnHeight,
      width,
      height,
    })

    columnHeight += height + design.gap.y
  }

  computed.size.width = usableSize.width
  computed.size.height = columnHeight + design.gap.y + 2 * design.pad.y
    + 80 // Safety space for bottom menu.

  return computed
}
