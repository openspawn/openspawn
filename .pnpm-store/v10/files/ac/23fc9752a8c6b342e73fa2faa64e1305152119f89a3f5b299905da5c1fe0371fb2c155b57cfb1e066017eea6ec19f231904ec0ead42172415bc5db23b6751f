import * as React from 'react';
import type { BaseUIComponentProps, NonNativeButtonProps } from "../../utils/types.js";
import type { FieldRoot } from "../../field/root/FieldRoot.js";
/**
 * Represents the radio button itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export declare const RadioRoot: React.ForwardRefExoticComponent<Omit<RadioRootProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface RadioRootState extends FieldRoot.State {
  /** Whether the radio button is currently selected. */
  checked: boolean;
  /** Whether the component should ignore user interaction. */
  disabled: boolean;
  /** Whether the user should be unable to select the radio button. */
  readOnly: boolean;
  /** Whether the user must choose a value before submitting a form. */
  required: boolean;
}
export interface RadioRootProps extends NonNativeButtonProps, Omit<BaseUIComponentProps<'span', RadioRoot.State>, 'value'> {
  /** The unique identifying value of the radio in a group. */
  value: any;
  /** Whether the component should ignore user interaction. */
  disabled?: boolean;
  /** Whether the user must choose a value before submitting a form. */
  required?: boolean;
  /** Whether the user should be unable to select the radio button. */
  readOnly?: boolean;
  /** A ref to access the hidden input element. */
  inputRef?: React.Ref<HTMLInputElement>;
}
export declare namespace RadioRoot {
  type State = RadioRootState;
  type Props = RadioRootProps;
}