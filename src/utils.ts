export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Rect extends Point, Size {
}

export const dbKey = 'flakepiles:height-cache'

export const idFloatingArea = 'fp-floating-area'

export const px = (x: number) => `${x}px`

export const point = (x: number, y: number) => `${x}px ${y}px`

export const noopAsync = async () => await Promise.resolve()

export function getScrollbarHeight($element: HTMLElement | null) {
  const offsetHeight = $element?.offsetHeight ?? 0
  const clientHeight = $element?.clientHeight ?? 0
  return offsetHeight - clientHeight
}
