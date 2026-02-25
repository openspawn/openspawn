"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldValidity = void 0;
var React = _interopRequireWildcard(require("react"));
var _FieldRootContext = require("../root/FieldRootContext");
var _getCombinedFieldValidityData = require("../utils/getCombinedFieldValidityData");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Used to display a custom message based on the field’s validity.
 * Requires `children` to be a function that accepts field validity state as an argument.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldValidity = exports.FieldValidity = function FieldValidity(props) {
  const {
    children
  } = props;
  const {
    validityData,
    invalid
  } = (0, _FieldRootContext.useFieldRootContext)(false);
  const fieldValidityState = React.useMemo(() => {
    const combinedFieldValidityData = (0, _getCombinedFieldValidityData.getCombinedFieldValidityData)(validityData, invalid);
    return {
      ...combinedFieldValidityData,
      validity: combinedFieldValidityData.state
    };
  }, [validityData, invalid]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(React.Fragment, {
    children: children(fieldValidityState)
  });
};
if (process.env.NODE_ENV !== "production") FieldValidity.displayName = "FieldValidity";