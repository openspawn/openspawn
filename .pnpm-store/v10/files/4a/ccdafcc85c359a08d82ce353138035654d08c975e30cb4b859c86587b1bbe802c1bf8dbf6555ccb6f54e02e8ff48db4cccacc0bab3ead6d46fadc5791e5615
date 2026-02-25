'use client';

import * as React from 'react';
import { error } from '@base-ui/utils/error';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getTarget } from "../../floating-ui-react/utils.js";
import { useFieldRootContext } from "../root/FieldRootContext.js";
import { useLabelableContext } from "../../labelable-provider/LabelableContext.js";
import { fieldValidityMapping } from "../utils/constants.js";
import { useBaseUiId } from "../../utils/useBaseUiId.js";
import { useRenderElement } from "../../utils/useRenderElement.js";

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldLabel = /*#__PURE__*/React.forwardRef(function FieldLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    id: idProp,
    nativeLabel = true,
    ...elementProps
  } = componentProps;
  const fieldRootContext = useFieldRootContext(false);
  const {
    controlId,
    setLabelId,
    labelId
  } = useLabelableContext();
  const id = useBaseUiId(idProp);
  const labelRef = React.useRef(null);
  const handleInteraction = useStableCallback(event => {
    const target = getTarget(event.nativeEvent);
    if (target?.closest('button,input,select,textarea')) {
      return;
    }

    // Prevent text selection when double clicking label.
    if (!event.defaultPrevented && event.detail > 1) {
      event.preventDefault();
    }
    if (nativeLabel || !controlId) {
      return;
    }
    const controlElement = ownerDocument(event.currentTarget).getElementById(controlId);
    if (isHTMLElement(controlElement)) {
      controlElement.focus({
        // Available from Chrome 144+ (January 2026).
        // Safari and Firefox already support it.
        // @ts-expect-error not available in types yet
        focusVisible: true
      });
    }
  });
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!labelRef.current) {
        return;
      }
      const isLabelTag = labelRef.current.tagName === 'LABEL';
      if (nativeLabel) {
        if (!isLabelTag) {
          error('<Field.Label> was not rendered as a <label> element, which does not match the `nativeLabel` prop on the component. Ensure that the element passed to the `render` prop of <Field.Label> is a real <label>, or set the `nativeLabel` prop on the component to `false`.');
        }
      } else if (isLabelTag) {
        error('<Field.Label> was rendered as a <label> element, which does not match the `nativeLabel` prop on the component. Ensure that the element passed to the `render` prop of <Field.Label> is not a real <label>, or set the `nativeLabel` prop on the component to `true`.');
      }
    }, [nativeLabel]);
  }
  useIsoLayoutEffect(() => {
    if (id) {
      setLabelId(id);
    }
    return () => {
      setLabelId(undefined);
    };
  }, [id, setLabelId]);
  const element = useRenderElement('label', componentProps, {
    ref: [forwardedRef, labelRef],
    state: fieldRootContext.state,
    props: [{
      id: labelId
    }, nativeLabel ? {
      htmlFor: controlId ?? undefined,
      onMouseDown: handleInteraction
    } : {
      onClick: handleInteraction,
      onPointerDown(event) {
        event.preventDefault();
      }
    }, elementProps],
    stateAttributesMapping: fieldValidityMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") FieldLabel.displayName = "FieldLabel";