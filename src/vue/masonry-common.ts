import type { CSSProperties } from 'vue'

export const FLAKE_UNIT = 320
export const GAP_X = 12
export const GAP_Y = 12
export const PAD_X = 16
export const PAD_Y = 8

export const px = (value: number) => `${value}px`

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

export interface ResolveMasonryOptions extends MasonryOptions {
  editing: string | null
}

export interface StyledMasonry {
  mansory: CSSProperties
  outer: Map<string, CSSProperties>
  inner: Map<string, CSSProperties>
}

export const createStyledMasonry = (): StyledMasonry => {
  return {
    mansory: {},
    outer: new Map(),
    inner: new Map(),
  }
}
