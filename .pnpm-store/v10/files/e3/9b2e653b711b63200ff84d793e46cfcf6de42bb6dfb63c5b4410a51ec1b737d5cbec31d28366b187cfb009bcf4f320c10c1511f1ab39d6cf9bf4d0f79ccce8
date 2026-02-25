"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _inertValue = require("@base-ui/utils/inertValue");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _usePreviousValue = require("@base-ui/utils/usePreviousValue");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _PopoverRootContext = require("../root/PopoverRootContext");
var _PopoverPositionerContext = require("../positioner/PopoverPositionerContext");
var _useAnimationsFinished = require("../../utils/useAnimationsFinished");
var _usePopupAutoResize = require("../../utils/usePopupAutoResize");
var _useRenderElement = require("../../utils/useRenderElement");
var _PopoverViewportCssVars = require("./PopoverViewportCssVars");
var _DirectionContext = require("../../direction-provider/DirectionContext");
var _jsxRuntime = require("react/jsx-runtime");
const stateAttributesMapping = {
  activationDirection: value => value ? {
    'data-activation-direction': value
  } : null
};

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content change based on the trigger
 * and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverViewport = exports.PopoverViewport = /*#__PURE__*/React.forwardRef(function PopoverViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    children,
    ...elementProps
  } = componentProps;
  const {
    store
  } = (0, _PopoverRootContext.usePopoverRootContext)();
  const positioner = (0, _PopoverPositionerContext.usePopoverPositionerContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const activeTrigger = store.useState('activeTriggerElement');
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload');
  const popupElement = store.useState('popupElement');
  const positionerElement = store.useState('positionerElement');
  const previousActiveTrigger = (0, _usePreviousValue.usePreviousValue)(open ? activeTrigger : null);
  const capturedNodeRef = React.useRef(null);
  const [previousContentNode, setPreviousContentNode] = React.useState(null);
  const [newTriggerOffset, setNewTriggerOffset] = React.useState(null);
  const currentContainerRef = React.useRef(null);
  const previousContainerRef = React.useRef(null);
  const onAnimationsFinished = (0, _useAnimationsFinished.useAnimationsFinished)(currentContainerRef, true, false);
  const cleanupFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const [previousContentDimensions, setPreviousContentDimensions] = React.useState(null);
  const [showStartingStyleAttribute, setShowStartingStyleAttribute] = React.useState(false);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    store.set('hasViewport', true);
    return () => {
      store.set('hasViewport', false);
    };
  }, [store]);

  // Capture a clone of the current content DOM subtree when not transitioning.
  // We can't store previous React nodes as they may be stateful; instead we capture DOM clones for visual continuity.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // When a transition is in progress, we store the next content in capturedNodeRef.
    // This handles the case where the trigger changes multiple times before the transition finishes.
    // We want to always capture the latest content for the previous snapshot.
    // So clicking quickly on T1, T2, T3 will result in the following sequence:
    // 1. T1 -> T2: previousContent = T1, currentContent = T2
    // 2. T2 -> T3: previousContent = T2, currentContent = T3
    const source = currentContainerRef.current;
    if (!source) {
      return;
    }
    const wrapper = document.createElement('div');
    for (const child of Array.from(source.childNodes)) {
      wrapper.appendChild(child.cloneNode(true));
    }
    capturedNodeRef.current = wrapper;
  });
  const handleMeasureLayout = (0, _useStableCallback.useStableCallback)(() => {
    currentContainerRef.current?.style.setProperty('animation', 'none');
    currentContainerRef.current?.style.setProperty('transition', 'none');
    previousContainerRef.current?.style.setProperty('display', 'none');
  });
  const handleMeasureLayoutComplete = (0, _useStableCallback.useStableCallback)(previousDimensions => {
    currentContainerRef.current?.style.removeProperty('animation');
    currentContainerRef.current?.style.removeProperty('transition');
    previousContainerRef.current?.style.removeProperty('display');
    if (previousDimensions) {
      setPreviousContentDimensions(previousDimensions);
    }
  });
  const lastHandledTriggerRef = React.useRef(null);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // When a trigger changes, set the captured children HTML to state,
    // so we can render both new and old content.
    if (activeTrigger && previousActiveTrigger && activeTrigger !== previousActiveTrigger && lastHandledTriggerRef.current !== activeTrigger && capturedNodeRef.current) {
      setPreviousContentNode(capturedNodeRef.current);
      setShowStartingStyleAttribute(true);

      // Calculate the relative position between the previous and new trigger,
      // so we can pass it to the style hook for animation purposes.
      const offset = calculateRelativePosition(previousActiveTrigger, activeTrigger);
      setNewTriggerOffset(offset);
      cleanupFrame.request(() => {
        cleanupFrame.request(() => {
          setShowStartingStyleAttribute(false);
          onAnimationsFinished(() => {
            setPreviousContentNode(null);
            setPreviousContentDimensions(null);
            capturedNodeRef.current = null;
          });
        });
      });
      lastHandledTriggerRef.current = activeTrigger;
    }
  }, [activeTrigger, previousActiveTrigger, previousContentNode, onAnimationsFinished, cleanupFrame]);
  const isTransitioning = previousContentNode != null;
  let childrenToRender;
  if (!isTransitioning) {
    childrenToRender = /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      "data-current": true,
      ref: currentContainerRef,
      children: children
    }, 'current');
  } else {
    childrenToRender = /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        "data-previous": true,
        inert: (0, _inertValue.inertValue)(true),
        ref: previousContainerRef,
        style: {
          [_PopoverViewportCssVars.PopoverViewportCssVars.popupWidth]: `${previousContentDimensions?.width}px`,
          [_PopoverViewportCssVars.PopoverViewportCssVars.popupHeight]: `${previousContentDimensions?.height}px`,
          position: 'absolute'
        },
        "data-ending-style": showStartingStyleAttribute ? undefined : ''
      }, 'previous'), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        "data-current": true,
        ref: currentContainerRef,
        "data-starting-style": showStartingStyleAttribute ? '' : undefined,
        children: children
      }, 'current')]
    });
  }

  // When previousContentNode is present, imperatively populate the previous container with the cloned children.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const container = previousContainerRef.current;
    if (!container || !previousContentNode) {
      return;
    }
    container.replaceChildren(...Array.from(previousContentNode.childNodes));
  }, [previousContentNode]);
  (0, _usePopupAutoResize.usePopupAutoResize)({
    popupElement,
    positionerElement,
    mounted,
    content: payload,
    onMeasureLayout: handleMeasureLayout,
    onMeasureLayoutComplete: handleMeasureLayoutComplete,
    side: positioner.side,
    direction
  });
  const state = React.useMemo(() => {
    return {
      activationDirection: getActivationDirection(newTriggerOffset),
      transitioning: isTransitioning
    };
  }, [newTriggerOffset, isTransitioning]);
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, {
      children: childrenToRender
    }],
    stateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") PopoverViewport.displayName = "PopoverViewport";
/**
 * Returns a string describing the provided offset.
 * It describes both the horizontal and vertical offset, separated by a space.
 *
 * @param offset
 */
function getActivationDirection(offset) {
  if (!offset) {
    return undefined;
  }
  return `${getValueWithTolerance(offset.horizontal, 5, 'right', 'left')} ${getValueWithTolerance(offset.vertical, 5, 'down', 'up')}`;
}

/**
 * Returns a label describing the value (positive/negative) trating values
 * within tolarance as zero.
 *
 * @param value Value to check
 * @param tolerance Tolerance to treat the value as zero.
 * @param positiveLabel
 * @param negativeLabel
 * @returns If 0 < abs(value) < tolerance, returns an empty string. Otherwise returns positiveLabel or negativeLabel.
 */
function getValueWithTolerance(value, tolerance, positiveLabel, negativeLabel) {
  if (value > tolerance) {
    return positiveLabel;
  }
  if (value < -tolerance) {
    return negativeLabel;
  }
  return '';
}

/**
 * Calculates the relative position between centers of two elements.
 */
function calculateRelativePosition(from, to) {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  const fromCenter = {
    x: fromRect.left + fromRect.width / 2,
    y: fromRect.top + fromRect.height / 2
  };
  const toCenter = {
    x: toRect.left + toRect.width / 2,
    y: toRect.top + toRect.height / 2
  };
  return {
    horizontal: toCenter.x - fromCenter.x,
    vertical: toCenter.y - fromCenter.y
  };
}