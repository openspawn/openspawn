import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from "../utils/types.js";
import type { BaseUIChangeEventDetails } from "../utils/createBaseUIEventDetails.js";
import { REASONS } from "../utils/reasons.js";
/**
 * Provides a shared state to a series of toggle buttons.
 *
 * Documentation: [Base UI Toggle Group](https://base-ui.com/react/components/toggle-group)
 */
export declare const ToggleGroup: React.ForwardRefExoticComponent<Omit<ToggleGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToggleGroupState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  multiple: boolean;
}
export interface ToggleGroupProps extends BaseUIComponentProps<'div', ToggleGroup.State> {
  /**
   * The open state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the controlled counterpart of `defaultValue`.
   */
  value?: readonly any[];
  /**
   * The open state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue?: readonly any[];
  /**
   * Callback fired when the pressed states of the toggle group changes.
   */
  onValueChange?: (groupValue: any[], eventDetails: ToggleGroup.ChangeEventDetails) => void;
  /**
   * Whether the toggle group should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * @default 'horizontal'
   */
  orientation?: Orientation;
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loopFocus?: boolean;
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   * @default false
   */
  multiple?: boolean;
}
export type ToggleGroupChangeEventReason = typeof REASONS.none;
export type ToggleGroupChangeEventDetails = BaseUIChangeEventDetails<ToggleGroup.ChangeEventReason>;
export declare namespace ToggleGroup {
  type State = ToggleGroupState;
  type Props = ToggleGroupProps;
  type ChangeEventReason = ToggleGroupChangeEventReason;
  type ChangeEventDetails = ToggleGroupChangeEventDetails;
}