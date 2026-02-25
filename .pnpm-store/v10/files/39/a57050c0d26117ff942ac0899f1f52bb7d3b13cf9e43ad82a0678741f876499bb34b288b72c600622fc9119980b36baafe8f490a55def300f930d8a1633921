'use client';

import * as React from 'react';
import { useFieldRootContext } from "../root/FieldRootContext.js";
import { getCombinedFieldValidityData } from "../utils/getCombinedFieldValidityData.js";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Used to display a custom message based on the field’s validity.
 * Requires `children` to be a function that accepts field validity state as an argument.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldValidity = function FieldValidity(props) {
  const {
    children
  } = props;
  const {
    validityData,
    invalid
  } = useFieldRootContext(false);
  const fieldValidityState = React.useMemo(() => {
    const combinedFieldValidityData = getCombinedFieldValidityData(validityData, invalid);
    return {
      ...combinedFieldValidityData,
      validity: combinedFieldValidityData.state
    };
  }, [validityData, invalid]);
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: children(fieldValidityState)
  });
};
if (process.env.NODE_ENV !== "production") FieldValidity.displayName = "FieldValidity";