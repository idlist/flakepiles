import { computed, triggerRef, type ShallowRef } from 'vue'

export const usePartialRef = <T extends object, K extends keyof T>(
  shallowRefObj: ShallowRef<T>,
  key: K,
) => {
  return computed({
    get: () => shallowRefObj.value[key],
    set: (value: T[K]) => {
      shallowRefObj.value[key] = value
      triggerRef(shallowRefObj)
    },
  })
}
