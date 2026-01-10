import {
  createStyledMasonry, FLAKE_UNIT, GAP_X, GAP_Y, PAD_X, PAD_Y,
  type ResolveMasonryOptions, type ResolvedMasonry,
} from './masonry-common'
import type { Flake } from '@/data'


export const resolveMasonryMobile = (
  flakes: Flake[], // For the ID order of the flakes.
  heightMap: Map<string, number>,
  options: ResolveMasonryOptions,
): ResolvedMasonry => {
  const styled = createStyledMasonry()

  return styled
}
