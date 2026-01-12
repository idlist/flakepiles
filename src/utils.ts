import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export const px = (x: number) => `${x}px`

export const pxpair = (x: number, y: number) => `${x}px ${y}px`

export const useCssIf = <T>(
  cond: MaybeRefOrGetter<T>,
  name: MaybeRefOrGetter<string>,
) => {
  return computed(() => toValue(cond) ? toValue(name) : '')
}

export const useCssWith = <T>(
  cond: MaybeRefOrGetter<T>,
  formatter: (value: T) => string,
) => {
  return computed(() => {
    const value = toValue(cond)
    return value ? formatter(value) : ''
  })
}

export class CausedError extends Error {
  cause: string

  constructor(message: string, cause: string) {
    super(message)
    this.cause = cause
  }
}
