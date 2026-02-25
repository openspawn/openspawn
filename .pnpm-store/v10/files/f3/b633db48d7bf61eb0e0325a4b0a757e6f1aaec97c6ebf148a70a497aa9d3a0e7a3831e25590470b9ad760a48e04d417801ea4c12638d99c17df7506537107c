"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isInteractiveElement = isInteractiveElement;
exports.safePolygonIdentifier = void 0;
exports.useHoverInteractionSharedState = useHoverInteractionSharedState;
var React = _interopRequireWildcard(require("react"));
var _useTimeout = require("@base-ui/utils/useTimeout");
var _createAttribute = require("../utils/createAttribute");
var _constants = require("../utils/constants");
const safePolygonIdentifier = exports.safePolygonIdentifier = (0, _createAttribute.createAttribute)('safe-polygon');
const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${_constants.TYPEABLE_SELECTOR}`;
function isInteractiveElement(element) {
  return element ? Boolean(element.closest(interactiveSelector)) : false;
}
function useHoverInteractionSharedState(store) {
  const pointerTypeRef = React.useRef(undefined);
  const interactedInsideRef = React.useRef(false);
  const handlerRef = React.useRef(undefined);
  const blockMouseMoveRef = React.useRef(true);
  const performedPointerEventsMutationRef = React.useRef(false);
  const unbindMouseMoveRef = React.useRef(() => {});
  const restTimeoutPendingRef = React.useRef(false);
  const openChangeTimeout = (0, _useTimeout.useTimeout)();
  const restTimeout = (0, _useTimeout.useTimeout)();
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