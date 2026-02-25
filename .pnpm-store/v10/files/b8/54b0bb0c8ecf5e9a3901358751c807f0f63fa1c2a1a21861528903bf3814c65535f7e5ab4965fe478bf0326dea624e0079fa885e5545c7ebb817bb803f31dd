'use client';

import * as React from 'react';
import { NOOP } from "../utils/noop.js";
export const RadioGroupContext = /*#__PURE__*/React.createContext({
  disabled: undefined,
  readOnly: undefined,
  required: undefined,
  name: undefined,
  checkedValue: '',
  setCheckedValue: NOOP,
  onValueChange: NOOP,
  touched: false,
  setTouched: NOOP,
  registerControlRef: NOOP
});
if (process.env.NODE_ENV !== "production") RadioGroupContext.displayName = "RadioGroupContext";
export function useRadioGroupContext() {
  return React.useContext(RadioGroupContext);
}