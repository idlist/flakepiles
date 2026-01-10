export const FLAKE_UNIT = 320
export const GAP_X = 12
export const GAP_Y = 12
export const PAD_X = 16
export const PAD_Y = 8

export const px = (x: number) => `${x}px`
export const pxy = (x: number, y: number) => `${x}px ${y}px`

export interface MasonryOptions {
  width: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
  masonryWidth: number
  masonryHeight: number
}

export interface ResolvedRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ResolvedSize {
  width: number
  height: number
}

export interface ResolvedMasonry {
  flakes: Set<string>
  rect: Map<string, ResolvedRect>
  masonry: ResolvedSize
}

export const createStyledMasonry = (): ResolvedMasonry => {
  return {
    flakes: new Set(),
    rect: new Map(),
    masonry: { width: 0, height: 0 },
  }
}
