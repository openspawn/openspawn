"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RadioGroupContext = void 0;
exports.useRadioGroupContext = useRadioGroupContext;
var React = _interopRequireWildcard(require("react"));
var _noop = require("../utils/noop");
const RadioGroupContext = exports.RadioGroupContext = /*#__PURE__*/React.createContext({
  disabled: undefined,
  readOnly: undefined,
  required: undefined,
  name: undefined,
  checkedValue: '',
  setCheckedValue: _noop.NOOP,
  onValueChange: _noop.NOOP,
  touched: false,
  setTouched: _noop.NOOP,
  registerControlRef: _noop.NOOP
});
if (process.env.NODE_ENV !== "production") RadioGroupContext.displayName = "RadioGroupContext";
function useRadioGroupContext() {
  return React.useContext(RadioGroupContext);
}