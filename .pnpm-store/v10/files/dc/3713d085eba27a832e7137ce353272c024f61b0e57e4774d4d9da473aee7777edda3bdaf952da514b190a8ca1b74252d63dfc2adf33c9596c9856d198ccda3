"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useHoverReferenceInteraction = useHoverReferenceInteraction;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _dom = require("@floating-ui/utils/dom");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _utils = require("../utils");
var _createBaseUIEventDetails = require("../../utils/createBaseUIEventDetails");
var _reasons = require("../../utils/reasons");
var _useHover = require("./useHover");
var _FloatingTree = require("../components/FloatingTree");
var _useHoverInteractionSharedState = require("./useHoverInteractionSharedState");
function getRestMs(value) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
const EMPTY_REF = {
  current: null
};

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
function useHoverReferenceInteraction(context, props = {}) {
  const store = 'rootStore' in context ? context.rootStore : context;
  const {
    dataRef,
    events
  } = store.context;
  const {
    enabled = true,
    delay = 0,
    handleClose = null,
    mouseOnly = false,
    restMs = 0,
    move = true,
    triggerElementRef = EMPTY_REF,
    externalTree,
    isActiveTrigger = true
  } = props;
  const tree = (0, _FloatingTree.useFloatingTree)(externalTree);
  const {
    pointerTypeRef,
    interactedInsideRef,
    handlerRef: closeHandlerRef,
    blockMouseMoveRef,
    performedPointerEventsMutationRef,
    unbindMouseMoveRef,
    restTimeoutPendingRef,
    openChangeTimeout,
    restTimeout,
    handleCloseOptionsRef
  } = (0, _useHoverInteractionSharedState.useHoverInteractionSharedState)(store);
  const handleCloseRef = (0, _useValueAsRef.useValueAsRef)(handleClose);
  const delayRef = (0, _useValueAsRef.useValueAsRef)(delay);
  const restMsRef = (0, _useValueAsRef.useValueAsRef)(restMs);
  if (isActiveTrigger) {
    // eslint-disable-next-line no-underscore-dangle
    handleCloseOptionsRef.current = handleCloseRef.current?.__options;
  }
  const isClickLikeOpenEvent = (0, _useStableCallback.useStableCallback)(() => {
    if (interactedInsideRef.current) {
      return true;
    }
    return dataRef.current.openEvent ? ['click', 'mousedown'].includes(dataRef.current.openEvent.type) : false;
  });
  const closeWithDelay = React.useCallback((event, runElseBranch = true) => {
    const closeDelay = (0, _useHover.getDelay)(delayRef.current, 'close', pointerTypeRef.current);
    if (closeDelay && !closeHandlerRef.current) {
      openChangeTimeout.start(closeDelay, () => store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event)));
    } else if (runElseBranch) {
      openChangeTimeout.clear();
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event));
    }
  }, [delayRef, closeHandlerRef, store, pointerTypeRef, openChangeTimeout]);
  const cleanupMouseMoveHandler = (0, _useStableCallback.useStableCallback)(() => {
    unbindMouseMoveRef.current();
    closeHandlerRef.current = undefined;
  });
  const clearPointerEvents = (0, _useStableCallback.useStableCallback)(() => {
    if (performedPointerEventsMutationRef.current) {
      const body = (0, _utils.getDocument)(store.select('domReferenceElement')).body;
      body.style.pointerEvents = '';
      body.removeAttribute(_useHoverInteractionSharedState.safePolygonIdentifier);
      performedPointerEventsMutationRef.current = false;
    }
  });

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function onOpenChangeLocal(details) {
      if (!details.open) {
        openChangeTimeout.clear();
        restTimeout.clear();
        blockMouseMoveRef.current = true;
        restTimeoutPendingRef.current = false;
      }
    }
    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [enabled, events, openChangeTimeout, restTimeout, blockMouseMoveRef, restTimeoutPendingRef]);
  const handleScrollMouseLeave = (0, _useStableCallback.useStableCallback)(event => {
    if (isClickLikeOpenEvent()) {
      return;
    }
    if (!dataRef.current.floatingContext) {
      return;
    }
    const triggerElements = store.context.triggerElements;
    if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget)) {
      return;
    }
    const currentTrigger = triggerElementRef.current;
    handleCloseRef.current?.({
      ...dataRef.current.floatingContext,
      tree,
      x: event.clientX,
      y: event.clientY,
      onClose() {
        clearPointerEvents();
        cleanupMouseMoveHandler();
        if (!isClickLikeOpenEvent() && currentTrigger === store.select('domReferenceElement')) {
          closeWithDelay(event);
        }
      }
    })(event);
  });
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const trigger = triggerElementRef.current ?? (isActiveTrigger ? store.select('domReferenceElement') : null);
    if (!(0, _dom.isElement)(trigger)) {
      return undefined;
    }
    function onMouseEnter(event) {
      openChangeTimeout.clear();
      blockMouseMoveRef.current = false;
      if (mouseOnly && !(0, _utils.isMouseLikePointerType)(pointerTypeRef.current)) {
        return;
      }

      // Only rest delay is set; there's no fallback delay.
      // This will be handled by `onMouseMove`.
      if (getRestMs(restMsRef.current) > 0 && !(0, _useHover.getDelay)(delayRef.current, 'open')) {
        return;
      }
      const openDelay = (0, _useHover.getDelay)(delayRef.current, 'open', pointerTypeRef.current);
      const currentDomReference = store.select('domReferenceElement');
      const allTriggers = store.context.triggerElements;
      const isOverInactiveTrigger = (allTriggers.hasElement(event.target) || allTriggers.hasMatchingElement(t => (0, _utils.contains)(t, event.target))) && (!currentDomReference || !(0, _utils.contains)(currentDomReference, event.target));
      const triggerNode = event.currentTarget ?? null;
      const isOpen = store.select('open');
      const shouldOpen = !isOpen || isOverInactiveTrigger;

      // When moving between triggers while already open, open immediately without delay
      if (isOverInactiveTrigger && isOpen) {
        store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event, triggerNode));
      } else if (openDelay) {
        openChangeTimeout.start(openDelay, () => {
          if (shouldOpen) {
            store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event, triggerNode));
          }
        });
      } else if (shouldOpen) {
        store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event, triggerNode));
      }
    }
    function onMouseLeave(event) {
      if (isClickLikeOpenEvent()) {
        clearPointerEvents();
        return;
      }
      unbindMouseMoveRef.current();
      const domReferenceElement = store.select('domReferenceElement');
      const doc = (0, _utils.getDocument)(domReferenceElement);
      restTimeout.clear();
      restTimeoutPendingRef.current = false;
      const triggerElements = store.context.triggerElements;
      if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget)) {
        return;
      }
      if (handleCloseRef.current && dataRef.current.floatingContext) {
        if (!store.select('open')) {
          openChangeTimeout.clear();
        }
        const currentTrigger = triggerElementRef.current;
        closeHandlerRef.current = handleCloseRef.current({
          ...dataRef.current.floatingContext,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (!isClickLikeOpenEvent() && currentTrigger === store.select('domReferenceElement')) {
              closeWithDelay(event, true);
            }
          }
        });
        const handler = closeHandlerRef.current;
        handler(event);
        doc.addEventListener('mousemove', handler);
        unbindMouseMoveRef.current = () => {
          doc.removeEventListener('mousemove', handler);
        };
        return;
      }
      const shouldClose = pointerTypeRef.current === 'touch' ? !(0, _utils.contains)(store.select('floatingElement'), event.relatedTarget) : true;
      if (shouldClose) {
        closeWithDelay(event);
      }
    }
    function onScrollMouseLeave(event) {
      handleScrollMouseLeave(event);
    }
    if (store.select('open')) {
      trigger.addEventListener('mouseleave', onScrollMouseLeave);
    }
    if (move) {
      trigger.addEventListener('mousemove', onMouseEnter, {
        once: true
      });
    }
    trigger.addEventListener('mouseenter', onMouseEnter);
    trigger.addEventListener('mouseleave', onMouseLeave);
    return () => {
      trigger.removeEventListener('mouseleave', onScrollMouseLeave);
      if (move) {
        trigger.removeEventListener('mousemove', onMouseEnter);
      }
      trigger.removeEventListener('mouseenter', onMouseEnter);
      trigger.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [cleanupMouseMoveHandler, clearPointerEvents, blockMouseMoveRef, dataRef, delayRef, closeWithDelay, store, enabled, handleCloseRef, handleScrollMouseLeave, isActiveTrigger, isClickLikeOpenEvent, mouseOnly, move, pointerTypeRef, restMsRef, restTimeout, restTimeoutPendingRef, openChangeTimeout, triggerElementRef, tree, unbindMouseMoveRef, closeHandlerRef]);
  return React.useMemo(() => {
    function setPointerRef(event) {
      pointerTypeRef.current = event.pointerType;
    }
    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        const {
          nativeEvent
        } = event;
        const trigger = event.currentTarget;
        const currentDomReference = store.select('domReferenceElement');
        const allTriggers = store.context.triggerElements;
        const currentOpen = store.select('open');
        const isOverInactiveTrigger = (allTriggers.hasElement(event.target) || allTriggers.hasMatchingElement(t => (0, _utils.contains)(t, event.target))) && (!currentDomReference || !(0, _utils.contains)(currentDomReference, event.target));
        if (mouseOnly && !(0, _utils.isMouseLikePointerType)(pointerTypeRef.current)) {
          return;
        }
        if (currentOpen && !isOverInactiveTrigger || getRestMs(restMsRef.current) === 0) {
          return;
        }
        if (!isOverInactiveTrigger && restTimeoutPendingRef.current && event.movementX ** 2 + event.movementY ** 2 < 2) {
          return;
        }
        restTimeout.clear();
        function handleMouseMove() {
          restTimeoutPendingRef.current = false;

          // A delayed hover open should not override a click-like open that happened
          // while the hover delay was pending.
          if (isClickLikeOpenEvent()) {
            return;
          }
          const latestOpen = store.select('open');
          if (!blockMouseMoveRef.current && (!latestOpen || isOverInactiveTrigger)) {
            store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, nativeEvent, trigger));
          }
        }
        if (pointerTypeRef.current === 'touch') {
          ReactDOM.flushSync(() => {
            handleMouseMove();
          });
        } else if (isOverInactiveTrigger && currentOpen) {
          handleMouseMove();
        } else {
          restTimeoutPendingRef.current = true;
          restTimeout.start(getRestMs(restMsRef.current), handleMouseMove);
        }
      }
    };
  }, [blockMouseMoveRef, isClickLikeOpenEvent, mouseOnly, store, pointerTypeRef, restMsRef, restTimeout, restTimeoutPendingRef]);
}