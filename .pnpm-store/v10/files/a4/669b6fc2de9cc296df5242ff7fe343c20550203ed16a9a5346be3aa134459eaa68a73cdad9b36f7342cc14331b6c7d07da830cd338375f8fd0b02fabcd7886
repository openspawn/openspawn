"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RadioRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _createBaseUIEventDetails = require("../../utils/createBaseUIEventDetails");
var _reasons = require("../../utils/reasons");
var _constants = require("../../utils/constants");
var _noop = require("../../utils/noop");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _useBaseUiId = require("../../utils/useBaseUiId");
var _useRenderElement = require("../../utils/useRenderElement");
var _useButton = require("../../use-button");
var _constants2 = require("../../composite/constants");
var _CompositeItem = require("../../composite/item/CompositeItem");
var _FieldRootContext = require("../../field/root/FieldRootContext");
var _FieldItemContext = require("../../field/item/FieldItemContext");
var _LabelableContext = require("../../labelable-provider/LabelableContext");
var _useLabelableId = require("../../labelable-provider/useLabelableId");
var _RadioGroupContext = require("../../radio-group/RadioGroupContext");
var _RadioRootContext = require("./RadioRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Represents the radio button itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
const RadioRoot = exports.RadioRoot = /*#__PURE__*/React.forwardRef(function RadioRoot(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    readOnly: readOnlyProp = false,
    required: requiredProp = false,
    value,
    inputRef: inputRefProp,
    nativeButton = false,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    disabled: disabledGroup,
    readOnly: readOnlyGroup,
    required: requiredGroup,
    checkedValue,
    setCheckedValue,
    touched,
    setTouched,
    validation,
    registerControlRef,
    name
  } = (0, _RadioGroupContext.useRadioGroupContext)();
  const {
    setDirty,
    validityData,
    setTouched: setFieldTouched,
    setFilled,
    state: fieldState,
    disabled: fieldDisabled
  } = (0, _FieldRootContext.useFieldRootContext)();
  const fieldItemContext = (0, _FieldItemContext.useFieldItemContext)();
  const {
    labelId,
    getDescriptionProps
  } = (0, _LabelableContext.useLabelableContext)();
  const disabled = fieldDisabled || fieldItemContext.disabled || disabledGroup || disabledProp;
  const readOnly = readOnlyGroup || readOnlyProp;
  const required = requiredGroup || requiredProp;
  const checked = checkedValue === value;
  const radioRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const mergedInputRef = (0, _useMergedRefs.useMergedRefs)(inputRefProp, inputRef);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (inputRef.current?.checked) {
      setFilled(true);
    }
  }, [setFilled]);
  const id = (0, _useBaseUiId.useBaseUiId)();
  const inputId = (0, _useLabelableId.useLabelableId)({
    id: idProp,
    implicit: false,
    controlRef: radioRef
  });
  const hiddenInputId = nativeButton ? undefined : inputId;
  const rootProps = {
    role: 'radio',
    'aria-checked': checked,
    'aria-required': required || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-labelledby': labelId,
    [_constants2.ACTIVE_COMPOSITE_ITEM]: checked ? '' : undefined,
    id: nativeButton ? inputId : id,
    onKeyDown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    },
    onClick(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }
      event.preventDefault();
      inputRef.current?.click();
    },
    onFocus(event) {
      if (event.defaultPrevented || disabled || readOnly || !touched) {
        return;
      }
      inputRef.current?.click();
      setTouched(false);
    }
  };
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const inputProps = {
    type: 'radio',
    ref: mergedInputRef,
    id: hiddenInputId,
    tabIndex: -1,
    style: name ? _visuallyHidden.visuallyHiddenInput : _visuallyHidden.visuallyHidden,
    'aria-hidden': true,
    disabled,
    checked,
    required,
    readOnly,
    onChange(event) {
      // Workaround for https://github.com/facebook/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }
      if (disabled || readOnly || value === undefined) {
        return;
      }
      const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent);
      if (details.isCanceled) {
        return;
      }
      setFieldTouched(true);
      setDirty(value !== validityData.initialValue);
      setFilled(true);
      setCheckedValue(value, details);
    },
    onFocus() {
      radioRef.current?.focus();
    }
  };
  const state = React.useMemo(() => ({
    ...fieldState,
    required,
    disabled,
    readOnly,
    checked
  }), [fieldState, disabled, readOnly, checked, required]);
  const contextValue = React.useMemo(() => state, [state]);
  const isRadioGroup = setCheckedValue !== _noop.NOOP;
  const refs = [forwardedRef, registerControlRef, radioRef, buttonRef];
  const props = [rootProps, getDescriptionProps, validation?.getValidationProps ?? _constants.EMPTY_OBJECT, elementProps, getButtonProps];
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    enabled: !isRadioGroup,
    state,
    ref: refs,
    props,
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_RadioRootContext.RadioRootContext.Provider, {
    value: contextValue,
    children: [isRadioGroup ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeItem.CompositeItem, {
      tag: "span",
      render: render,
      className: className,
      state: state,
      refs: refs,
      props: props,
      stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
    }) : element, /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ...inputProps
    })]
  });
});
if (process.env.NODE_ENV !== "production") RadioRoot.displayName = "RadioRoot";