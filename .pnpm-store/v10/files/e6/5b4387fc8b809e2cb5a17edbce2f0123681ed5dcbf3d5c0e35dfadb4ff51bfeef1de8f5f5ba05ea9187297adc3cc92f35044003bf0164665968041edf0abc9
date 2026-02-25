"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldError = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _FieldRootContext = require("../root/FieldRootContext");
var _LabelableContext = require("../../labelable-provider/LabelableContext");
var _constants = require("../utils/constants");
var _FormContext = require("../../form/FormContext");
var _useRenderElement = require("../../utils/useRenderElement");
var _useBaseUiId = require("../../utils/useBaseUiId");
/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldError = exports.FieldError = /*#__PURE__*/React.forwardRef(function FieldError(componentProps, forwardedRef) {
  const {
    render,
    id: idProp,
    className,
    match,
    ...elementProps
  } = componentProps;
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const {
    validityData,
    state,
    name
  } = (0, _FieldRootContext.useFieldRootContext)(false);
  const {
    setMessageIds
  } = (0, _LabelableContext.useLabelableContext)();
  const {
    errors
  } = (0, _FormContext.useFormContext)();
  const formError = name ? errors[name] : null;
  let rendered = false;
  if (formError || match === true) {
    rendered = true;
  } else if (match) {
    rendered = Boolean(validityData.state[match]);
  } else {
    rendered = validityData.state.valid === false;
  }
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!rendered || !id) {
      return undefined;
    }
    setMessageIds(v => v.concat(id));
    return () => {
      setMessageIds(v => v.filter(item => item !== id));
    };
  }, [rendered, id, setMessageIds]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [{
      id,
      children: formError || (validityData.errors.length > 1 ? /*#__PURE__*/React.createElement('ul', {}, validityData.errors.map(message => /*#__PURE__*/React.createElement('li', {
        key: message
      }, message))) : validityData.error)
    }, elementProps],
    stateAttributesMapping: _constants.fieldValidityMapping
  });
  if (!rendered) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") FieldError.displayName = "FieldError";