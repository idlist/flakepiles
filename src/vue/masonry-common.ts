import type { PileAdaptiveFlow } from '@/data'
import { getVerticalBasis } from './masonry-vertical'

export const FLAKE_UNIT = 320
export const GAP_X = 12
export const GAP_Y = 12
export const PAD_X = 16
export const PAD_Y = 8

export interface MasonryOptions {
  width: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
  canvasWidth: number
  canvasHeight: number
}

export interface ResolvedRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ResolvedMasonrySize {
  width: number
  height: number
}

const createResolvedMasonrySize = (): ResolvedMasonrySize => {
  return {
    width: 0,
    height: 0,
  }
}

export interface ResolvedMasonry {
  flakes: Set<string>
  rects: Map<string, ResolvedRect>
  masonry: ResolvedMasonrySize
}

export const createStyledMasonry = (): ResolvedMasonry => {
  return {
    flakes: new Set(),
    rects: new Map(),
    masonry: createResolvedMasonrySize(),
  }
}

export const getUnsetWidth = (
  flow: PileAdaptiveFlow,
  options: MasonryOptions,
): number => {
  if (flow == 'mobile') {
    return options.canvasWidth - 2 * PAD_X
  }
  else if (flow == 'vertical' && options.elasticWidth) {
    return getVerticalBasis(options).width
  }
  else {
    return FLAKE_UNIT * options.width
  }
}
