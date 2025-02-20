<template>
  <va-dropdown
    class="va-popover"
    :position="$props.placement"
    :disabled="$props.disabled"
    :trigger="$props.trigger"
    :hoverOverTimeout="$props.hoverOverTimeout"
    :hoverOutTimeout="$props.hoverOutTimeout"
    :close-on-click-outside="$props.autoHide"
    :modelValue="modelValue"
  >
    <template #default>
      <div class="va-popover__content-wrapper">
        <div
          class="va-popover__content"
          :style="computedPopoverStyle"
        >
          <div
            v-if="$props.icon"
            class="va-popover__icon"
          >
            <va-icon
              :name="$props.icon"
              :color="$props.color"
            />
          </div>
          <div v-if="$props.title || $props.message">
            <div
              v-if="$props.title"
              class="va-popover__title"
            >
              {{ $props.title }}
            </div>
            <div class="va-popover__text">
              {{ $props.message }}
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #anchor>
      <slot />
    </template>
  </va-dropdown>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { Options, prop, Vue, mixins } from 'vue-class-component'
import { Placement } from '@popperjs/core'

import {
  getBoxShadowColor,
  getHoverColor,
} from '../../services/color-config/color-functions'
import ColorMixin from '../../services/color-config/ColorMixin'
import VaIcon from '../va-icon'
import VaDropdown from '../va-dropdown'

class PopoverProps {
  modelValue = prop<boolean>({ type: Boolean })
  color = prop<string>({ type: String, default: 'success' })
  icon = prop<string>({ type: String, default: '' })
  title = prop<string>({ type: String, default: '' })
  message = prop<string>({ type: String, default: '' })
  trigger = prop<string>({ type: String, default: 'hover' })
  disabled = prop<boolean>({ type: Boolean, default: false })
  placement = prop<Placement>({
    type: String as PropType<Placement>,
    default: 'bottom',
  })

  autoHide = prop<boolean>({ type: Boolean, default: true })
  hoverOverTimeout = prop<number>({ type: Number, default: 0 })
  hoverOutTimeout = prop<number>({ type: Number, default: 0 })
}

const PopoverPropsMixin = Vue.with(PopoverProps)

@Options({
  placement: {
    type: String,
    default: 'bottom',
    validator: (value: string) => {
      return ['right', 'left', 'bottom', 'top'].includes(value)
    },
  },
  trigger: {
    type: String,
    default: 'hover',
    validator: (value: string) => {
      return ['hover', 'focus', 'click'].includes(value)
    },
  },
  name: 'VaPopover',
  components: { VaIcon, VaDropdown },
})
export default class VaPopover extends mixins(
  ColorMixin,
  PopoverPropsMixin,
) {
  get computedPopoverStyle () {
    return {
      boxShadow: '0px 2px 3px 0 ' + getBoxShadowColor(this.theme.getColor(this.$props.color)),
      backgroundColor: getHoverColor(this.theme.getColor(this.$props.color)),
    }
  }
}
</script>

<style lang="scss">
@import '../../styles/resources';
@import 'variables';

.va-popover {
  display: var(--va-popover-display);

  &__content-wrapper {
    background-color: white;
    border-radius: 0.5rem;
  }

  &__content {
    opacity: var(--va-popover-content-opacity);
    display: var(--va-popover-content-display);
    align-items: var(--va-popover-content-align-items);
    padding: var(--va-popover-content-padding);
    border-radius: var(--va-popover-content-border-radius, var(--va-block-border-radius));
    font-size: var(--va-popover-content-font-size);
  }

  &__icon + div {
    padding-left: 0.75rem;
    width: 100%;
    overflow: hidden;
  }

  &__title {
    font-weight: var(--va-popover-title-font-weight);
    margin-bottom: var(--va-popover-title-margin-bottom);
  }

  &__text {
    line-height: 1.5;
  }
}
</style>
