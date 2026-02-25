'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFieldRootContext } from "../root/FieldRootContext.js";
import { useLabelableContext } from "../../labelable-provider/LabelableContext.js";
import { fieldValidityMapping } from "../utils/constants.js";
import { useFormContext } from "../../form/FormContext.js";
import { useRenderElement } from "../../utils/useRenderElement.js";
import { useBaseUiId } from "../../utils/useBaseUiId.js";

/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldError = /*#__PURE__*/React.forwardRef(function FieldError(componentProps, forwardedRef) {
  const {
    render,
    id: idProp,
    className,
    match,
    ...elementProps
  } = componentProps;
  const id = useBaseUiId(idProp);
  const {
    validityData,
    state,
    name
  } = useFieldRootContext(false);
  const {
    setMessageIds
  } = useLabelableContext();
  const {
    errors
  } = useFormContext();
  const formError = name ? errors[name] : null;
  let rendered = false;
  if (formError || match === true) {
    rendered = true;
  } else if (match) {
    rendered = Boolean(validityData.state[match]);
  } else {
    rendered = validityData.state.valid === false;
  }
  useIsoLayoutEffect(() => {
    if (!rendered || !id) {
      return undefined;
    }
    setMessageIds(v => v.concat(id));
    return () => {
      setMessageIds(v => v.filter(item => item !== id));
    };
  }, [rendered, id, setMessageIds]);
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [{
      id,
      children: formError || (validityData.errors.length > 1 ? /*#__PURE__*/React.createElement('ul', {}, validityData.errors.map(message => /*#__PURE__*/React.createElement('li', {
        key: message
      }, message))) : validityData.error)
    }, elementProps],
    stateAttributesMapping: fieldValidityMapping
  });
  if (!rendered) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") FieldError.displayName = "FieldError";