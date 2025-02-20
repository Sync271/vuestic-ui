<template>
  <va-dropdown
    ref="dropdown"
    class="va-select__dropdown va-select-dropdown"
    trigger="none"
    anchorSelector=".va-input-wrapper__input"
    :position="$props.position"
    :disabled="$props.disabled"
    :max-height="$props.maxHeight"
    :fixed="$props.fixed"
    :close-on-content-click="closeOnContentClick"
    :stateful="false"
    :offset="[0, 1]"
    keep-anchor-width
    v-model="showDropdownContentComputed"
    @keydown.up.stop.prevent="showDropdown()"
    @keydown.down.stop.prevent="showDropdown()"
    @keydown.space.stop.prevent="showDropdown()"
    @click.prevent="onSelectClick()"
  >
    <template #anchor>
      <div class="va-select">
        <va-input
          ref="input"
          :model-value="valueComputedString"
          :success="$props.success"
          :error="computedError"
          :color="$props.color"
          :label="$props.label"
          :placeholder="$props.placeholder"
          :loading="$props.loading"
          :disabled="$props.disabled"
          :outline="$props.outline"
          :bordered="$props.bordered"
          :required-mark="$props.requiredMark"
          :tabindex="tabIndexComputed"
          :messages="$props.messages"
          :error-messages="computedErrorMessages"
          readonly
          @focus="onInputFocus()"
          @blur="onInputBlur()"
        >
          <template
            v-if="$slots.prepend"
            #prepend
          >
            <slot name="prepend" />
          </template>

          <template
            v-if="$slots.append"
            #append
          >
            <slot name="append" />
          </template>

          <template
            v-if="$slots.prependInner"
            #prependInner
          >
            <slot name="prependInner" />
          </template>

          <template #icon>
            <va-icon
              v-if="showClearIcon"
              v-bind="clearIconProps"
              @click.stop="reset()"
            />
          </template>

          <template #appendInner>
            <slot
              v-if="$slots.appendInner"
              name="appendInner"
            />
            <va-icon
              :color="toggleIconColor"
              :name="toggleIcon"
            />
          </template>

          <template v-if="$slots.content" #content>
            <slot
              name="content"
              v-bind="{ valueString: valueComputedString, value: valueComputed }"
            />
          </template>
        </va-input>
      </div>
    </template>

    <!-- Stop propagation for enter keyup event, to prevent VaDropdown closing -->
    <va-dropdown-content
      class="va-select-dropdown__content"
      :style="{ width: $props.width }"
      @keyup.enter.stop
      @keydown.tab.stop.prevent
      @keydown.esc.prevent="hideDropdown()"
    >
      <va-input
        v-if="showSearchInput"
        ref="searchBar"
        class="va-select__input"
        placeholder="Search"
        :tabindex="tabindex + 1"
        :bordered="true"
        v-model="searchInput"
        @keydown.up.stop.prevent="hoverPreviousOption()"
        @keydown.left.stop.prevent="hoverPreviousOption()"
        @keydown.down.stop.prevent="hoverNextOption()"
        @keydown.right.stop.prevent="hoverNextOption()"
        @keydown.enter.prevent="selectOrAddOption()"
        @focus="hoveredOption = null"
      />
      <div class="va-select-dropdown__options-wrapper">
        <va-select-option-list
          ref="optionList"
          v-model:hoveredOption="hoveredOption"
          :style="{ maxHeight: $props.maxHeight }"
          :options="filteredOptions"
          :selected-value="valueComputed"
          :get-selected-state="checkIsOptionSelected"
          :get-text="getText"
          :get-track-by="getTrackBy"
          :get-group-by="getGroupBy"
          :search="searchInput"
          :no-options-text="$props.noOptionsText"
          :color="$props.color"
          :tabindex="tabindex + 1"
          @select-option="selectOption"
          @no-previous-option-to-hover="focusSearchBar()"
          @keydown.enter.stop.prevent="selectHoveredOption()"
          @keydown.space.stop.prevent="selectHoveredOption()"
          @keydown.tab.stop.prevent="searchBar && searchBar.focus()"
          @keydown="onHintedSearch"
          @scroll-bottom="onScrollBottom"
        />
      </div>
    </va-dropdown-content>
  </va-dropdown>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch, nextTick } from 'vue'

import { useSelectableList, useSelectableListProps, SelectableOption } from '../../composables/useSelectableList'
import { useValidation, useValidationProps, useValidationEmits } from '../../composables/useValidation'
import { useFormProps } from '../../composables/useForm'
import { useLoadingProps } from '../../composables/useLoading'
import { useColor } from '../../composables/useColor'
import { useMaxSelections, useMaxSelectionsProps } from '../../composables/useMaxSelections'
import { useClearableProps, useClearable, useClearableEmits } from '../../composables/useClearable'
import { useColors } from '../../services/color-config/color-config'
import { warn } from '../../services/utils'
import VaDropdown, { VaDropdownContent } from '../va-dropdown'
import VaIcon from '../va-icon'
import VaInput from '../va-input'
import VaSelectOptionList from './VaSelectOptionList'

const { getHoverColor } = useColors()

type DropdownIcon = {
  open: string,
  close: string
}

export default defineComponent({
  name: 'VaSelect',

  components: {
    VaSelectOptionList,
    VaIcon,
    VaDropdown,
    VaDropdownContent,
    VaInput,
  },

  emits: [
    'update:modelValue',
    'update-search',
    'create-new',
    'scroll-bottom',
    ...useValidationEmits,
    ...useClearableEmits,
  ],

  props: {
    ...useSelectableListProps,
    ...useValidationProps,
    ...useLoadingProps,
    ...useMaxSelectionsProps,
    ...useClearableProps,
    ...useFormProps,

    modelValue: {
      type: [String, Number, Object] as PropType<SelectableOption>,
      default: '',
    },

    // Dropdown position
    position: {
      type: String as PropType<string>,
      default: 'bottom',
      validator: (position: string) => ['top', 'bottom'].includes(position),
    },

    allowCreate: {
      type: [Boolean, String] as PropType<boolean | string>,
      default: false,
      validator: (mode: string | boolean) => {
        return [true, false, 'unique'].includes(mode)
      },
    },

    color: { type: String as PropType<string>, default: 'primary' },
    multiple: { type: Boolean as PropType<boolean>, default: false },
    searchable: { type: Boolean as PropType<boolean>, default: false },
    separator: { type: String as PropType<string>, default: ', ' },
    width: { type: String as PropType<string>, default: '100%' },
    maxHeight: { type: String as PropType<string>, default: '256px' },
    noOptionsText: { type: String as PropType<string>, default: 'Items not found' },
    fixed: { type: Boolean as PropType<boolean>, default: true },
    hideSelected: { type: Boolean as PropType<boolean>, default: false },
    tabindex: { type: Number as PropType<number>, default: 0 },
    dropdownIcon: {
      type: [String, Object] as PropType<string | DropdownIcon>,
      default: (): DropdownIcon => ({
        open: 'expand_more',
        close: 'expand_less',
      }),
      validator: (value: any) => {
        if (typeof value === 'string') { return true }

        const isOpenIconString = typeof value.open === 'string'
        const isCloseIconString = typeof value.close === 'string'

        return isOpenIconString && isCloseIconString
      },
    },

    // Input style
    outline: { type: Boolean as PropType<boolean>, default: false },
    bordered: { type: Boolean as PropType<boolean>, default: false },
    label: { type: String as PropType<string>, default: '' },
    placeholder: { type: String as PropType<string>, default: '' },
    requiredMark: { type: Boolean as PropType<boolean>, default: false },
  },

  setup (props, { emit }) {
    const optionList = ref<InstanceType<typeof VaSelectOptionList>>()
    const input = ref<InstanceType<typeof VaInput>>()
    const searchBar = ref<InstanceType<typeof VaInput>>()

    const { getOptionByValue, getValue, getText, getTrackBy, getGroupBy } = useSelectableList(props)

    const {
      isFocused,
      validate,
      computedError,
      computedErrorMessages,
    } = useValidation(props, emit, () => reset(), () => focus())

    const { colorComputed } = useColor(props)
    const toggleIconColor = computed(() => (
      props.readonly ? getHoverColor(colorComputed.value) : colorComputed.value
    ))

    const onScrollBottom = () => {
      emit('scroll-bottom')
    }

    const searchInput = ref('')
    const showSearchInput = computed(() => {
      return props.searchable || props.allowCreate
    })

    watch(() => searchInput.value, (value) => {
      emit('update-search', value)
      hoveredOption.value = null
    })

    // Select value

    const valueComputed = computed({
      get () {
        const value = getOptionByValue(props.modelValue)

        if (props.multiple) {
          if (!value) {
            return []
          }

          if (!Array.isArray(value)) {
            return [value]
          }

          return value
        }

        if (Array.isArray(value)) {
          warn('Model value should be a string or a number for a single Select.')

          if (value.length) {
            return value[value.length - 1]
          }
        }

        return value
      },

      set (value: any) {
        emit('update:modelValue', getValue(value))
      },
    })

    const valueComputedString = computed((): string | number => {
      if (!valueComputed.value) { return props.clearValue }
      if (typeof valueComputed.value === 'string' || typeof valueComputed.value === 'number') { return valueComputed.value }
      if (Array.isArray(valueComputed.value)) {
        return valueComputed.value.map((value) => getText(value)).join(props.separator) || props.clearValue
      }

      return getText(valueComputed.value)
    })

    // Icons
    const {
      canBeCleared,
      clearIconProps,
    } = useClearable(props, valueComputed, isFocused, computedError)

    const showClearIcon = computed(() => {
      if (props.multiple) { return !!valueComputed.value.length }
      return canBeCleared.value
    })

    const toggleIcon = computed((): string => {
      if (!props.dropdownIcon) { return '' }

      if (typeof props.dropdownIcon === 'string') {
        return props.dropdownIcon
      }

      return showDropdownContent.value ? props.dropdownIcon.close : props.dropdownIcon.open
    })

    // Options

    const filteredOptions = computed((): any[] => {
      if (!props.options) { return [] }

      if (props.hideSelected) {
        return (props.options).filter((option) => !checkIsOptionSelected(option))
      }

      return props.options
    })

    const checkIsOptionSelected = (option: any): boolean => {
      if (!valueComputed.value) { return false }

      if (Array.isArray(valueComputed.value)) {
        return !!valueComputed.value.find((valueItem: any) => compareOptions(valueItem, option))
      }

      return compareOptions(valueComputed.value, option)
    }

    const compareOptions = (one: any, two: any) => {
      // identity check works nice for strings and exact matches.
      if (one === two) {
        return true
      }
      if (typeof one === 'string' && typeof two === 'string') {
        return one === two
      }
      if (one === null || two === null) {
        return false
      }
      if (typeof one === 'object' && typeof two === 'object') {
        return getTrackBy(one) === getTrackBy(two)
      }

      return false
    }

    const { exceedsMaxSelections, addOption } = useMaxSelections(valueComputed, ref(props.maxSelections), emit)

    const selectOption = (option: any): void => {
      if (hoveredOption.value === null) {
        hideDropdown()
        return
      }

      if (showSearchInput.value) {
        searchInput.value = ''
      }

      if (props.multiple) {
        const isSelected = checkIsOptionSelected(option)

        if (isSelected) {
          // Unselect
          valueComputed.value = valueComputed.value.filter((optionSelected: any) => !compareOptions(option, optionSelected))
        } else {
          if (exceedsMaxSelections()) { return }
          addOption(option)
        }
      } else {
        valueComputed.value = typeof option === 'string' || typeof option === 'number' ? option : { ...option }
        hideDropdown()
      }
    }

    const selectOrAddOption = () => {
      if (hoveredOption.value !== null) {
        selectHoveredOption()
        return
      }

      if (allowedToCreate()) {
        addNewOption()
      }
    }

    const allowedToCreate = (): boolean => {
      return !!(props.allowCreate && searchInput.value !== '')
    }

    const addNewOption = (): void => {
      // Do not emit if option already exist and allow create is `unique`
      const hasAddedOption: boolean = props.options?.some((option: any) => getText(option) === searchInput.value)

      if (!(props.allowCreate === 'unique' && hasAddedOption)) {
        emit('create-new', searchInput.value)
        searchInput.value = ''
      }
    }

    // Hovered options

    const hoveredOption = ref(null as any)

    const selectHoveredOption = () => {
      if (!showDropdownContent.value) {
        // We can not select options if they are hidden
        showDropdown()
        return
      }

      selectOption(hoveredOption.value)
    }

    const hoverPreviousOption = () => {
      optionList.value?.hoverPreviousOption()
    }

    const hoverNextOption = () => {
      optionList.value?.hoverNextOption()
    }

    // Dropdown content

    const showDropdownContent = ref(false)

    const showDropdownContentComputed = computed({
      get: () => {
        return showDropdownContent.value
      },
      set: (show: boolean) => {
        show
          ? showDropdown()
          : hideDropdown()
      },
    })

    const closeOnContentClick = computed(() => {
      return !(props.multiple || props.searchable || props.allowCreate)
    })

    const showDropdown = () => {
      if (props.disabled || props.readonly) { return }

      showDropdownContent.value = true
      scrollToSelected()
      focusSearchOrOptions()
    }

    const hideDropdown = () => {
      showDropdownContent.value = false
      searchInput.value = ''
      validate()
      input.value?.focus()
    }

    const toggleDropdown = () => {
      if (showDropdownContent.value) {
        hideDropdown()
      } else {
        showDropdown()
      }
    }

    const onSelectClick = () => {
      if (props.disabled || props.readonly) { return }
      toggleDropdown()
    }

    const focusSearchBar = () => {
      searchBar.value?.focus()
    }

    const focusOptionList = () => {
      optionList.value?.focus()
      optionList.value?.hoverFirstOption()
    }

    const focusSearchOrOptions = () => {
      nextTick(() => {
        if (showSearchInput.value) {
          focusSearchBar()
        } else { focusOptionList() }
      })
    }

    const onInputFocus = (): void => {
      if (!isFocused.value) {
        isFocused.value = true
      }
    }

    const onInputBlur = (): void => {
      if (!showDropdownContentComputed.value) {
        isFocused.value
          ? isFocused.value = false
          : validate()
      }
    }

    /** @public */
    const focus = (): void => {
      if (props.disabled) { return }
      input.value?.focus()
    }

    /** @public */
    const blur = (): void => {
      if (showDropdownContentComputed.value) {
        showDropdownContentComputed.value = false
        nextTick(() => {
          input.value?.blur()
        })
      } else {
        input.value?.blur()
      }
    }

    /** @public */
    const reset = (): void => {
      if (props.multiple) {
        valueComputed.value = Array.isArray(props.clearValue) ? props.clearValue : []
      } else {
        valueComputed.value = props.clearValue
      }

      searchInput.value = ''
      emit('clear')
    }

    const tabIndexComputed = computed(() => {
      return props.disabled ? -1 : props.tabindex
    })

    const scrollToSelected = (): void => {
      const selected = valueComputed.value
      const nothingSelected = !selected.length && typeof selected !== 'object'

      if (nothingSelected) {
        return
      }

      const scrollTo = Array.isArray(selected) ? selected[selected.length - 1] : selected
      hoveredOption.value = scrollTo
      nextTick(() => optionList.value?.scrollToOption(scrollTo))
    }

    // Hinted search

    let hintedSearchQuery = ''
    let hintedSearchQueryTimeoutIndex!: any
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ']

    // Hinted search - hover option if you typing it's value on select without search-bar
    const onHintedSearch = (event: KeyboardEvent) => {
      if (navigationKeys.some(key => key === event.key)) {
        return
      }

      const isLetter: boolean = event.key.length === 1
      const isDeleteKey: boolean = event.key === 'Backspace' || event.key === 'Delete'

      clearTimeout(hintedSearchQueryTimeoutIndex)

      if (isDeleteKey) {
        // Remove last letter from query
        hintedSearchQuery = hintedSearchQuery ? hintedSearchQuery.slice(0, -1) : ''
      } else if (isLetter) {
        // Add every new letter to the query
        hintedSearchQuery += event.key
      }

      if (showSearchInput.value) {
        searchInput.value = hintedSearchQuery
        return
      }

      // Search for an option that matches the query
      if (hintedSearchQuery) {
        const appropriateOption = props.options.find(option => getText(option).toLowerCase().startsWith(hintedSearchQuery.toLowerCase()))
        if (appropriateOption) {
          hoveredOption.value = appropriateOption
        }
      }

      hintedSearchQueryTimeoutIndex = setTimeout(() => { hintedSearchQuery = '' }, 1000)
    }

    return {
      input,
      optionList,
      searchBar,

      // while we have problem with 'withConfigTransport'
      // focus,
      // blur,

      onInputFocus,
      onInputBlur,
      focusOptionList,
      reset,
      onSelectClick,
      focusSearchBar,
      searchInput,
      showSearchInput,
      hoveredOption,
      tabIndexComputed,
      valueComputed,
      valueComputedString,
      showClearIcon,
      toggleIcon,
      computedErrorMessages,
      computedError,
      filteredOptions,
      checkIsOptionSelected,
      closeOnContentClick,
      selectOption,
      selectOrAddOption,
      selectHoveredOption,
      hoverPreviousOption,
      hoverNextOption,
      showDropdownContentComputed,
      showDropdown,
      hideDropdown,
      toggleDropdown,
      toggleIconColor,
      onHintedSearch,
      getText,
      getTrackBy,
      getGroupBy,
      onScrollBottom,
      clearIconProps,
    }
  },
  // we will use this while we have problem with 'withConfigTransport'
  methods: {
    focus () {
      if (this.$props.disabled) { return }
      this.input?.focus()
    },
    blur () {
      if (this.showDropdownContentComputed) {
        this.showDropdownContentComputed = false
        nextTick(() => {
          this.input?.blur()
        })
      } else {
        this.input?.blur()
      }
    },
  },
})
</script>

<style lang="scss">
@import "../../styles/resources";
@import 'variables';

.va-select {
  cursor: var(--va-select-cursor);

  .va-input {
    cursor: var(--va-select-cursor);
  }
}

.va-select-dropdown {
  .va-dropdown__anchor {
    display: block;
  }

  &__content {
    overflow: hidden;
    border-bottom-right-radius: var(--va-select-dropdown-border-radius);
    border-bottom-left-radius: var(--va-select-dropdown-border-radius);
    border-top-right-radius: 0;
    border-top-left-radius: 0;
    box-shadow: var(--va-select-box-shadow);
    padding: 0;
  }

  &__options-wrapper {
    background: var(--va-select-dropdown-background);
    overflow-y: auto;

    @include va-scroll(var(--va-select-scroll-color));
  }
}

</style>
