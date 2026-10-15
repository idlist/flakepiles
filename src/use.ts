import type { Emitter } from 'mitt'
import { computed, type MaybeRefOrGetter, onScopeDispose, toValue } from 'vue'
import type { FlakepilePluginRef } from './custom-view'
import type { FlakeMeta, FlakepileMeta } from './schemes/common'

// Uses are ordered roughly from more general to more specific.

export const useCssIf = <T>(
  condition: MaybeRefOrGetter<T>,
  className: MaybeRefOrGetter<string>,
) => {
  return computed(() => toValue(condition) ? toValue(className) : '')
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

export function useListener<T extends Record<string, unknown>>(bus: Emitter<T>) {
  const listen = <K extends keyof T>(key: K, listener: (value: T[K]) => void) => {
    bus.on(key, listener)
    onScopeDispose(() => bus.off(key, listener))

    const stop = () => bus.off(key, listener)
    return stop
  }

  return listen
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

export function useFlakeMetaBinder(plugin: FlakepilePluginRef) {
  const bind = <T extends keyof FlakeMeta>(meta: FlakeMeta, id: string, key: T) => {
    return computed<FlakeMeta[T]>({
      get: () => meta[key],
      set: (val) => plugin.updateFlakeMeta(id, key, val),
    })
  }

  return bind
}
