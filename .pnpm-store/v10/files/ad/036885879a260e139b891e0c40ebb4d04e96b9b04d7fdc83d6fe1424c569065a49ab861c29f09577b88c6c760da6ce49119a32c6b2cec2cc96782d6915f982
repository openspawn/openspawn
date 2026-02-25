import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { createAttribute } from "../utils/createAttribute.js";
import { TYPEABLE_SELECTOR } from "../utils/constants.js";
export const safePolygonIdentifier = createAttribute('safe-polygon');
const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;
export function isInteractiveElement(element) {
  return element ? Boolean(element.closest(interactiveSelector)) : false;
}
export function useHoverInteractionSharedState(store) {
  const pointerTypeRef = React.useRef(undefined);
  const interactedInsideRef = React.useRef(false);
  const handlerRef = React.useRef(undefined);
  const blockMouseMoveRef = React.useRef(true);
  const performedPointerEventsMutationRef = React.useRef(false);
  const unbindMouseMoveRef = React.useRef(() => {});
  const restTimeoutPendingRef = React.useRef(false);
  const openChangeTimeout = useTimeout();
  const restTimeout = useTimeout();
  const handleCloseOptionsRef = React.useRef(undefined);
  return React.useMemo(() => {
    const data = store.context.dataRef.current;
    if (!data.hoverInteractionState) {
      data.hoverInteractionState = {
        pointerTypeRef,
        interactedInsideRef,
        handlerRef,
        blockMouseMoveRef,
        performedPointerEventsMutationRef,
        unbindMouseMoveRef,
        restTimeoutPendingRef,
        openChangeTimeout,
        restTimeout,
        handleCloseOptionsRef
      };
    }
    return data.hoverInteractionState;
  }, [store, pointerTypeRef, interactedInsideRef, handlerRef, blockMouseMoveRef, performedPointerEventsMutationRef, unbindMouseMoveRef, restTimeoutPendingRef, openChangeTimeout, restTimeout, handleCloseOptionsRef]);
}