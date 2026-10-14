import type { FlakepileAdaptiveFlow, FlakepileMeta, HeightRecord } from '@/schemes/v1'
import type { Point, Rect, Size } from '@/utils'
import { Platform } from 'obsidian'
import { computeHorizontalMasonry } from './horizontal'
import { computeMobileMasonry } from './mobile'
import { computeVerticalBase, computeVerticalMasonry } from './vertical'

interface Design {
  gap: Point
  pad: Point
}

export function getDesign(): Design {
  if (Platform.isMobile) {
    return {
      gap: { x: 12, y: 12 },
      pad: { x: 16, y: 12 },
    }
  } else {
    return {
      gap: { x: 12, y: 12 },
      pad: { x: 4, y: 8 },
    }
  }
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

export interface ComputeMasonryRequirements {
  ids: string[]
  heights: HeightRecord
  meta: FlakepileMeta
  usableSize: Size
}

export function computeMasonry(
  flow: FlakepileAdaptiveFlow,
  required: ComputeMasonryRequirements,
): ComputedMasonry {
  switch (flow) {
    case 'vertical':
      return computeVerticalMasonry(required)
    case 'horizontal':
      return computeHorizontalMasonry(required)
    case 'mobile':
      return computeMobileMasonry(required)
  }
}

export function computeInitialWidth(
  flow: FlakepileAdaptiveFlow,
  meta: FlakepileMeta,
  usableSize: Size,
): number {
  const design = getDesign()

  if (flow === 'mobile') {
    return usableSize.width - 2 * design.pad.x
  } else if (flow === 'vertical' && meta.elasticWidth) {
    return computeVerticalBase(meta, usableSize).width
  } else {
    return meta.width
  }
}
