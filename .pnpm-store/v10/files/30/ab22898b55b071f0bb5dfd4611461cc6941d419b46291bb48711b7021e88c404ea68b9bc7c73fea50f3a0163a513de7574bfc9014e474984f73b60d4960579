"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDelay = getDelay;
exports.useHoverFloatingInteraction = useHoverFloatingInteraction;
var React = _interopRequireWildcard(require("react"));
var _dom = require("@floating-ui/utils/dom");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _utils = require("../utils");
var _createBaseUIEventDetails = require("../../utils/createBaseUIEventDetails");
var _reasons = require("../../utils/reasons");
var _FloatingTree = require("../components/FloatingTree");
var _useHoverInteractionSharedState = require("./useHoverInteractionSharedState");
const clickLikeEvents = new Set(['click', 'mousedown']);

/**
 * Provides hover interactions that should be attached to the floating element.
 */
function useHoverFloatingInteraction(context, parameters = {}) {
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const domReferenceElement = store.useState('domReferenceElement');
  const {
    dataRef
  } = store.context;
  const {
    enabled = true,
    closeDelay: closeDelayProp = 0,
    externalTree
  } = parameters;
  const {
    pointerTypeRef,
    interactedInsideRef,
    handlerRef,
    performedPointerEventsMutationRef,
    unbindMouseMoveRef,
    restTimeoutPendingRef,
    openChangeTimeout: openChangeTimeout,
    handleCloseOptionsRef
  } = (0, _useHoverInteractionSharedState.useHoverInteractionSharedState)(store);
  const tree = (0, _FloatingTree.useFloatingTree)(externalTree);
  const parentId = (0, _FloatingTree.useFloatingParentNodeId)();
  const isClickLikeOpenEvent = (0, _useStableCallback.useStableCallback)(() => {
    if (interactedInsideRef.current) {
      return true;
    }
    return dataRef.current.openEvent ? clickLikeEvents.has(dataRef.current.openEvent.type) : false;
  });
  const isHoverOpen = (0, _useStableCallback.useStableCallback)(() => {
    const type = dataRef.current.openEvent?.type;
    return type?.includes('mouse') && type !== 'mousedown';
  });
  const closeWithDelay = React.useCallback((event, runElseBranch = true) => {
    const closeDelay = getDelay(closeDelayProp, pointerTypeRef.current);
    if (closeDelay && !handlerRef.current) {
      openChangeTimeout.start(closeDelay, () => store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event)));
    } else if (runElseBranch) {
      openChangeTimeout.clear();
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event));
    }
  }, [closeDelayProp, handlerRef, store, pointerTypeRef, openChangeTimeout]);
  const cleanupMouseMoveHandler = (0, _useStableCallback.useStableCallback)(() => {
    unbindMouseMoveRef.current();
    handlerRef.current = undefined;
  });
  const clearPointerEvents = (0, _useStableCallback.useStableCallback)(() => {
    if (performedPointerEventsMutationRef.current) {
      const body = (0, _utils.getDocument)(floatingElement).body;
      body.style.pointerEvents = '';
      body.removeAttribute(_useHoverInteractionSharedState.safePolygonIdentifier);
      performedPointerEventsMutationRef.current = false;
    }
  });
  const handleInteractInside = (0, _useStableCallback.useStableCallback)(event => {
    const target = (0, _utils.getTarget)(event);
    if (!(0, _useHoverInteractionSharedState.isInteractiveElement)(target)) {
      interactedInsideRef.current = false;
      return;
    }
    interactedInsideRef.current = true;
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open) {
      pointerTypeRef.current = undefined;
      restTimeoutPendingRef.current = false;
      interactedInsideRef.current = false;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  }, [open, pointerTypeRef, restTimeoutPendingRef, interactedInsideRef, cleanupMouseMoveHandler, clearPointerEvents]);
  React.useEffect(() => {
    return () => {
      cleanupMouseMoveHandler();
    };
  }, [cleanupMouseMoveHandler]);
  React.useEffect(() => {
    return clearPointerEvents;
  }, [clearPointerEvents]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!enabled) {
      return undefined;
    }
    if (open && handleCloseOptionsRef.current?.blockPointerEvents && isHoverOpen() && (0, _dom.isElement)(domReferenceElement) && floatingElement) {
      performedPointerEventsMutationRef.current = true;
      const body = (0, _utils.getDocument)(floatingElement).body;
      body.setAttribute(_useHoverInteractionSharedState.safePolygonIdentifier, '');
      const ref = domReferenceElement;
      const floatingEl = floatingElement;
      const parentFloating = tree?.nodesRef.current.find(node => node.id === parentId)?.context?.elements.floating;
      if (parentFloating) {
        parentFloating.style.pointerEvents = '';
      }
      body.style.pointerEvents = 'none';
      ref.style.pointerEvents = 'auto';
      floatingEl.style.pointerEvents = 'auto';
      return () => {
        body.style.pointerEvents = '';
        ref.style.pointerEvents = '';
        floatingEl.style.pointerEvents = '';
      };
    }
    return undefined;
  }, [enabled, open, domReferenceElement, floatingElement, handleCloseOptionsRef, isHoverOpen, tree, parentId, performedPointerEventsMutationRef]);
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    // Ensure the floating element closes after scrolling even if the pointer
    // did not move.
    // https://github.com/floating-ui/floating-ui/discussions/1692
    function onScrollMouseLeave(event) {
      if (isClickLikeOpenEvent() || !dataRef.current.floatingContext || !store.select('open')) {
        return;
      }
      const triggerElements = store.context.triggerElements;
      if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget)) {
        // If the mouse is leaving the reference element to another trigger, don't explicitly close the popup
        // as it will be moved.
        return;
      }
      clearPointerEvents();
      cleanupMouseMoveHandler();
      if (!isClickLikeOpenEvent()) {
        closeWithDelay(event);
      }
    }
    function onFloatingMouseEnter(event) {
      openChangeTimeout.clear();
      clearPointerEvents();
      handlerRef.current?.(event);
      cleanupMouseMoveHandler();
    }
    function onFloatingMouseLeave(event) {
      if (!isClickLikeOpenEvent()) {
        closeWithDelay(event, false);
      }
    }
    const floating = floatingElement;
    if (floating) {
      floating.addEventListener('mouseleave', onScrollMouseLeave);
      floating.addEventListener('mouseenter', onFloatingMouseEnter);
      floating.addEventListener('mouseleave', onFloatingMouseLeave);
      floating.addEventListener('pointerdown', handleInteractInside, true);
    }
    return () => {
      if (floating) {
        floating.removeEventListener('mouseleave', onScrollMouseLeave);
        floating.removeEventListener('mouseenter', onFloatingMouseEnter);
        floating.removeEventListener('mouseleave', onFloatingMouseLeave);
        floating.removeEventListener('pointerdown', handleInteractInside, true);
      }
    };
  });
}
function getDelay(value, pointerType) {
  if (pointerType && !(0, _utils.isMouseLikePointerType)(pointerType)) {
    return 0;
  }
  if (typeof value === 'function') {
    return value();
  }
  return value;
}