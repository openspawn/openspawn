import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../utils/types.js";
import { type BaseUIChangeEventDetails } from "../utils/createBaseUIEventDetails.js";
import { REASONS } from "../utils/reasons.js";
/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export declare const Toggle: React.ForwardRefExoticComponent<Omit<ToggleProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface ToggleState {
  /**
   * Whether the toggle is currently pressed.
   */
  pressed: boolean;
  /**
   * Whether the toggle should ignore user interaction.
   */
  disabled: boolean;
}
export interface ToggleProps extends NativeButtonProps, BaseUIComponentProps<'button', Toggle.State> {
  /**
   * Whether the toggle button is currently pressed.
   * This is the controlled counterpart of `defaultPressed`.
   */
  pressed?: boolean;
  /**
   * Whether the toggle button is currently pressed.
   * This is the uncontrolled counterpart of `pressed`.
   * @default false
   */
  defaultPressed?: boolean;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Callback fired when the pressed state is changed.
   */
  onPressedChange?: (pressed: boolean, eventDetails: Toggle.ChangeEventDetails) => void;
  /**
   * A unique string that identifies the toggle when used
   * inside a toggle group.
   */
  value?: string;
}
export type ToggleChangeEventReason = typeof REASONS.none;
export type ToggleChangeEventDetails = BaseUIChangeEventDetails<Toggle.ChangeEventReason>;
export declare namespace Toggle {
  type State = ToggleState;
  type Props = ToggleProps;
  type ChangeEventReason = ToggleChangeEventReason;
  type ChangeEventDetails = ToggleChangeEventDetails;
}