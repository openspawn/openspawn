'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { NOOP } from "../utils/noop.js";
import { useBaseUiId } from "../utils/useBaseUiId.js";
import { contains } from "../floating-ui-react/utils.js";
import { SHIFT } from "../composite/composite.js";
import { CompositeRoot } from "../composite/root/CompositeRoot.js";
import { useField } from "../field/useField.js";
import { useFieldRootContext } from "../field/root/FieldRootContext.js";
import { fieldValidityMapping } from "../field/utils/constants.js";
import { useFieldsetRootContext } from "../fieldset/root/FieldsetRootContext.js";
import { useFormContext } from "../form/FormContext.js";
import { useLabelableContext } from "../labelable-provider/LabelableContext.js";
import { mergeProps } from "../merge-props/index.js";
import { useValueChanged } from "../utils/useValueChanged.js";
import { RadioGroupContext } from "./RadioGroupContext.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MODIFIER_KEYS = [SHIFT];

/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Radio Group](https://base-ui.com/react/components/radio)
 */
export const RadioGroup = /*#__PURE__*/React.forwardRef(function RadioGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp,
    readOnly,
    required,
    onValueChange: onValueChangeProp,
    value: externalValue,
    defaultValue,
    name: nameProp,
    inputRef: inputRefProp,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    setTouched: setFieldTouched,
    setFocused,
    shouldValidateOnChange,
    validationMode,
    name: fieldName,
    disabled: fieldDisabled,
    state: fieldState,
    validation,
    setDirty,
    setFilled,
    validityData
  } = useFieldRootContext();
  const {
    labelId
  } = useLabelableContext();
  const {
    clearErrors
  } = useFormContext();
  const fieldsetContext = useFieldsetRootContext(true);
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const id = useBaseUiId(idProp);
  const [checkedValue, setCheckedValueUnwrapped] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value'
  });
  const onValueChange = useStableCallback(onValueChangeProp);
  const setCheckedValue = useStableCallback((value, eventDetails) => {
    onValueChange(value, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setCheckedValueUnwrapped(value);
  });
  const controlRef = React.useRef(null);
  const registerControlRef = useStableCallback(element => {
    if (controlRef.current == null && element != null) {
      controlRef.current = element;
    }
  });
  useField({
    id,
    commit: validation.commit,
    value: checkedValue,
    controlRef,
    name,
    getValue: () => checkedValue ?? null
  });
  useValueChanged(checkedValue, () => {
    clearErrors(name);
    setDirty(checkedValue !== validityData.initialValue);
    setFilled(checkedValue != null);
    if (shouldValidateOnChange()) {
      validation.commit(checkedValue);
    } else {
      validation.commit(checkedValue, true);
    }
  });
  const [touched, setTouched] = React.useState(false);
  const onBlur = useStableCallback(event => {
    if (!contains(event.currentTarget, event.relatedTarget)) {
      setFieldTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        validation.commit(checkedValue);
      }
    }
  });
  const onKeyDownCapture = useStableCallback(event => {
    if (event.key.startsWith('Arrow')) {
      setFieldTouched(true);
      setTouched(true);
      setFocused(true);
    }
  });
  const serializedCheckedValue = React.useMemo(() => {
    if (checkedValue == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof checkedValue === 'string') {
      return checkedValue;
    }
    return JSON.stringify(checkedValue);
  }, [checkedValue]);
  const mergedInputRef = useMergedRefs(validation.inputRef, inputRefProp);
  const inputProps = mergeProps({
    value: serializedCheckedValue,
    ref: mergedInputRef,
    id,
    name: serializedCheckedValue ? name : undefined,
    disabled,
    readOnly,
    required,
    'aria-labelledby': elementProps['aria-labelledby'] ?? fieldsetContext?.legendId,
    'aria-hidden': true,
    tabIndex: -1,
    style: name ? visuallyHiddenInput : visuallyHidden,
    onChange: NOOP,
    // suppress a Next.js error
    onFocus() {
      controlRef.current?.focus();
    }
  }, validation.getInputValidationProps);
  const state = React.useMemo(() => ({
    ...fieldState,
    disabled: disabled ?? false,
    required: required ?? false,
    readOnly: readOnly ?? false
  }), [fieldState, disabled, readOnly, required]);
  const contextValue = React.useMemo(() => ({
    ...fieldState,
    checkedValue,
    disabled,
    validation,
    name,
    onValueChange,
    readOnly,
    registerControlRef,
    required,
    setCheckedValue,
    setTouched,
    touched
  }), [checkedValue, disabled, validation, fieldState, name, onValueChange, readOnly, registerControlRef, required, setCheckedValue, setTouched, touched]);
  const defaultProps = {
    role: 'radiogroup',
    'aria-required': required || undefined,
    'aria-disabled': disabled || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-labelledby': labelId,
    onFocus() {
      setFocused(true);
    },
    onBlur,
    onKeyDownCapture
  };
  return /*#__PURE__*/_jsxs(RadioGroupContext.Provider, {
    value: contextValue,
    children: [/*#__PURE__*/_jsx(CompositeRoot, {
      render: render,
      className: className,
      state: state,
      props: [defaultProps, validation.getValidationProps, elementProps],
      refs: [forwardedRef],
      stateAttributesMapping: fieldValidityMapping,
      enableHomeAndEndKeys: false,
      modifierKeys: MODIFIER_KEYS
    }), /*#__PURE__*/_jsx("input", {
      ...inputProps
    })]
  });
});
if (process.env.NODE_ENV !== "production") RadioGroup.displayName = "RadioGroup";