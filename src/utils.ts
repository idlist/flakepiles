import { useElementSize, type MaybeComputedElementRef } from '@vueuse/core'
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

export const useElementBorderSize = (target: MaybeComputedElementRef) => {
  return useElementSize(target, { width: 0, height: 0 }, { box: 'border-box' })
}

export class CausedError<T> extends Error {
  cause: string
  data?: T

  constructor(message: string, cause: string, data?: T) {
    super(message)
    this.cause = cause
    this.data = data
  }
}
