'use client';

import * as React from 'react';
import { useRenderElement } from "../../utils/useRenderElement.js";
import { useRadioRootContext } from "../root/RadioRootContext.js";
import { stateAttributesMapping } from "../utils/stateAttributesMapping.js";
import { useOpenChangeComplete } from "../../utils/useOpenChangeComplete.js";
import { useTransitionStatus } from "../../utils/useTransitionStatus.js";

/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export const RadioIndicator = /*#__PURE__*/React.forwardRef(function RadioIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const rootState = useRadioRootContext();
  const rendered = rootState.checked;
  const {
    transitionStatus,
    setMounted
  } = useTransitionStatus(rendered);
  const state = React.useMemo(() => ({
    ...rootState,
    transitionStatus
  }), [rootState, transitionStatus]);
  const indicatorRef = React.useRef(null);
  const shouldRender = keepMounted || rendered;
  const element = useRenderElement('span', componentProps, {
    enabled: shouldRender,
    ref: [forwardedRef, indicatorRef],
    state,
    props: elementProps,
    stateAttributesMapping
  });
  useOpenChangeComplete({
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    }
  });
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") RadioIndicator.displayName = "RadioIndicator";