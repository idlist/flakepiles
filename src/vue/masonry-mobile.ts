import type { Flake } from '@/data'
import { createStyledMasonry, GAP_Y, type MasonryOptions, PAD_X, PAD_Y, type ResolvedMasonry } from './masonry-common'

export const resolveMasonryMobile = (
  flakes: Flake[], // For the ID order of the flakes.
  heightMap: Map<string, number>,
  options: MasonryOptions,
): ResolvedMasonry => {
  const styled = createStyledMasonry()

  const width = options.canvasWidth - 2 * PAD_X
  let columnHeight = 0

  for (const flake of flakes) {
    const id = flake.id
    const height = heightMap.get(id)
    if (!height) continue

    styled.flakes.add(id)

    styled.rects.set(id, {
      x: PAD_X,
      y: PAD_Y + columnHeight,
      width,
      height,
    })

    columnHeight += height + GAP_Y
  }

  styled.masonry.width = options.canvasWidth
  styled.masonry.height = columnHeight + GAP_Y + 2 * PAD_Y + 80

  return styled
}
