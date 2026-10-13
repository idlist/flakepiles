import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { FlakepilePluginRef } from './custom-view'
import type { FlakepileMeta } from './schemes/v1'

export const useCssIf = <T>(
  condition: MaybeRefOrGetter<T>,
  name: MaybeRefOrGetter<string>,
) => {
  return computed(() => toValue(condition) ? toValue(name) : '')
}

export const useCssWith = <T>(
  condition: MaybeRefOrGetter<T>,
  formatter: (value: T) => string,
) => {
  return computed(() => {
    const value = toValue(condition)
    return value ? formatter(value) : ''
  })
}

export function useFlakepileMetaBinder(plugin: FlakepilePluginRef) {
  const bind = <T extends keyof FlakepileMeta>(meta: FlakepileMeta, key: T) => {
    return computed<FlakepileMeta[T]>({
      get: () => meta[key],
      set: (val) => plugin.updateFlakepileMeta(key, val),
    })
  }

  return bind
}
