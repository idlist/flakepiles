export const px = (x: number) => `${x}px`

export const point = (x: number, y: number) => `${x}px ${y}px`

export const noopAsync = async () => await Promise.resolve()

export class CausedError<T> extends Error {
  cause: string
  data?: T

  constructor(message: string, cause: string, data?: T) {
    super(message)
    this.cause = cause
    this.data = data
  }
}

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
