import { ref, computed, PropType } from 'vue'

export type StatefulProps<T> = {
  stateful: boolean
  modelValue: T
  [prop: string]: unknown
}

/**
 * You could add these props to any component by destructuring them inside props option.
 * @example
 * props: { ...useStatefulProps, componentsOwnProp, etc. }
 * It's better to add props at the beginning, to make sure that Component own props will be used instead in case of collision
 */
export const useStatefulProps = {
  stateful: { type: Boolean as PropType<boolean>, default: false },
  modelValue: { type: undefined as any as PropType<unknown> },
}

export const useStatefulEmits = ['update:modelValue']

/**
 * Returns `valueComputed` that is proxy for `modelValue`
 * if `stateful` prop is `false`
 * Record<any, any> & Record<'modelValue', T>
 */
export function useStateful<T, D extends T | undefined> (
  props: StatefulProps<T>,
  emit: (event: 'update:modelValue', newValue: T) => void,
  defaultValue?: D,
) {
  const valueState = ref(defaultValue === undefined ? props.modelValue : defaultValue)

  const valueComputed = computed({
    get () {
      if (props.stateful) {
        return valueState.value
      }
      return props.modelValue
    },
    set (value: any) {
      if (props.stateful) {
        valueState.value = value
      }
      emit('update:modelValue', value)
    },
  })

  return { valueComputed }
}
