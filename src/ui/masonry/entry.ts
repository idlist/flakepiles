import type { Flake, FlakepileAdaptiveFlow, FlakepileMeta } from '@/schemes/v1'
import type { Rect, Size } from '@/utils'
import { computeHorizontalMasonry } from './horizontal'
import { computeMobileMasonry } from './mobile'
import { computeVerticalBase, computeVerticalMasonry } from './vertical'

export const design = {
  gap: { x: 12, y: 12 },
  pad: { x: 4, y: 8 },
}

export interface ComputedMasonry {
  size: Size
  rects: Map<string, Rect>
}

export function setupComputedMasonry(): ComputedMasonry {
  return {
    size: { width: 0, height: 0 },
    rects: new Map(),
  }
}

export function computeMasonry(
  flow: FlakepileAdaptiveFlow,
  flakes: Flake[],
  meta: FlakepileMeta,
  usableSize: Size,
): ComputedMasonry {
  switch (flow) {
    case 'vertical':
      return computeVerticalMasonry(flakes, meta, usableSize)
    case 'horizontal':
      return computeHorizontalMasonry(flakes, meta, usableSize)
    case 'mobile':
      return computeMobileMasonry(flakes, meta, usableSize)
  }
}

export function computeInitialWidth(
  flow: FlakepileAdaptiveFlow,
  meta: FlakepileMeta,
  usableSize: Size,
): number {
  if (flow === 'mobile') {
    return usableSize.width - 2 * design.pad.x
  } else if (flow === 'vertical' && meta.elasticWidth) {
    return computeVerticalBase(meta, usableSize).width
  } else {
    return meta.width
  }
}
