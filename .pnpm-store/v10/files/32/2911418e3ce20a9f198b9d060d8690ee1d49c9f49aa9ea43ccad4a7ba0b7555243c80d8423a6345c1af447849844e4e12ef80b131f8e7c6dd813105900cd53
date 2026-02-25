import * as React from 'react';
import type { UseFieldValidationReturnValue } from "../field/root/useFieldValidation.js";
import type { BaseUIChangeEventDetails } from "../utils/createBaseUIEventDetails.js";
import type { BaseUIEventReasons } from "../utils/reasons.js";
export interface RadioGroupContext {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  name: string | undefined;
  checkedValue: unknown;
  setCheckedValue: (value: unknown, eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  onValueChange: (value: unknown, eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  validation?: UseFieldValidationReturnValue;
  registerControlRef: (element: HTMLElement | null) => void;
}
export declare const RadioGroupContext: React.Context<RadioGroupContext>;
export declare function useRadioGroupContext(): RadioGroupContext;