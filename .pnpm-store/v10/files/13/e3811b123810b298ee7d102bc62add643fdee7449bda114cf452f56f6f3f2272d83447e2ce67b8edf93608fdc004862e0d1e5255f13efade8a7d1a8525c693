"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _useTimeout = require("@base-ui/utils/useTimeout");
var _detectBrowser = require("@base-ui/utils/detectBrowser");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _owner = require("@base-ui/utils/owner");
var _isMouseWithinBounds = require("@base-ui/utils/isMouseWithinBounds");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _store = require("@base-ui/utils/store");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _floatingUiReact = require("../../floating-ui-react");
var _SelectRootContext = require("../root/SelectRootContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _SelectPositionerContext = require("../positioner/SelectPositionerContext");
var _styles = require("../../utils/styles");
var _stateAttributesMapping = require("../../utils/stateAttributesMapping");
var _useOpenChangeComplete = require("../../utils/useOpenChangeComplete");
var _useRenderElement = require("../../utils/useRenderElement");
var _store2 = require("../store");
var _utils = require("./utils");
var _createBaseUIEventDetails = require("../../utils/createBaseUIEventDetails");
var _reasons = require("../../utils/reasons");
var _ToolbarRootContext = require("../../toolbar/root/ToolbarRootContext");
var _composite = require("../../composite/composite");
var _getDisabledMountTransitionStyles = require("../../utils/getDisabledMountTransitionStyles");
var _clamp = require("../../utils/clamp");
var _CSPContext = require("../../csp-provider/CSPContext");
var _jsxRuntime = require("react/jsx-runtime");
const stateAttributesMapping = {
  ..._popupStateMapping.popupStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping
};

/**
 * A container for the select list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectPopup = exports.SelectPopup = /*#__PURE__*/React.forwardRef(function SelectPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    ...elementProps
  } = componentProps;
  const {
    store,
    popupRef,
    onOpenChangeComplete,
    setOpen,
    valueRef,
    selectedItemTextRef,
    keyboardActiveRef,
    multiple,
    handleScrollArrowVisibility,
    scrollHandlerRef,
    highlightItemOnHover
  } = (0, _SelectRootContext.useSelectRootContext)();
  const {
    side,
    align,
    alignItemWithTriggerActive,
    setControlledAlignItemWithTrigger,
    scrollDownArrowRef,
    scrollUpArrowRef
  } = (0, _SelectPositionerContext.useSelectPositionerContext)();
  const insideToolbar = (0, _ToolbarRootContext.useToolbarRootContext)(true) != null;
  const floatingRootContext = (0, _SelectRootContext.useSelectFloatingContext)();
  const {
    nonce,
    disableStyleElements
  } = (0, _CSPContext.useCSPContext)();
  const highlightTimeout = (0, _useTimeout.useTimeout)();
  const id = (0, _store.useStore)(store, _store2.selectors.id);
  const open = (0, _store.useStore)(store, _store2.selectors.open);
  const mounted = (0, _store.useStore)(store, _store2.selectors.mounted);
  const popupProps = (0, _store.useStore)(store, _store2.selectors.popupProps);
  const transitionStatus = (0, _store.useStore)(store, _store2.selectors.transitionStatus);
  const triggerElement = (0, _store.useStore)(store, _store2.selectors.triggerElement);
  const positionerElement = (0, _store.useStore)(store, _store2.selectors.positionerElement);
  const listElement = (0, _store.useStore)(store, _store2.selectors.listElement);
  const initialHeightRef = React.useRef(0);
  const reachedMaxHeightRef = React.useRef(false);
  const maxHeightRef = React.useRef(0);
  const initialPlacedRef = React.useRef(false);
  const originalPositionerStylesRef = React.useRef({});
  const scrollArrowFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const handleScroll = (0, _useStableCallback.useStableCallback)(scroller => {
    if (!positionerElement || !popupRef.current || !initialPlacedRef.current) {
      return;
    }
    if (reachedMaxHeightRef.current || !alignItemWithTriggerActive) {
      handleScrollArrowVisibility();
      return;
    }
    const isTopPositioned = positionerElement.style.top === '0px';
    const isBottomPositioned = positionerElement.style.bottom === '0px';
    const currentHeight = positionerElement.getBoundingClientRect().height;
    const doc = (0, _owner.ownerDocument)(positionerElement);
    const positionerStyles = getComputedStyle(positionerElement);
    const marginTop = parseFloat(positionerStyles.marginTop);
    const marginBottom = parseFloat(positionerStyles.marginBottom);
    const maxPopupHeight = getMaxPopupHeight(getComputedStyle(popupRef.current));
    const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
    const scrollTop = scroller.scrollTop;
    const scrollHeight = scroller.scrollHeight;
    const clientHeight = scroller.clientHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    let nextPositionerHeight = 0;
    let nextScrollTop = null;
    let setReachedMax = false;
    if (isTopPositioned) {
      const diff = maxScrollTop - scrollTop;
      const idealHeight = currentHeight + diff;
      const nextHeight = Math.min(idealHeight, viewportHeight);
      nextPositionerHeight = nextHeight;
      if (nextHeight !== viewportHeight) {
        nextScrollTop = maxScrollTop;
      } else {
        setReachedMax = true;
      }
    } else if (isBottomPositioned) {
      const diff = scrollTop - 0;
      const idealHeight = currentHeight + diff;
      const nextHeight = Math.min(idealHeight, viewportHeight);
      const overshoot = idealHeight - viewportHeight;
      nextPositionerHeight = nextHeight;
      if (nextHeight !== viewportHeight) {
        nextScrollTop = 0;
      } else {
        setReachedMax = true;
        if (scrollTop < maxScrollTop) {
          nextScrollTop = scrollTop - (diff - overshoot);
        }
      }
    }
    if (nextPositionerHeight !== 0) {
      positionerElement.style.height = `${nextPositionerHeight}px`;
    }
    if (nextScrollTop != null) {
      scroller.scrollTop = nextScrollTop;
    }
    if (setReachedMax || nextPositionerHeight >= maxPopupHeight) {
      reachedMaxHeightRef.current = true;
    }
    handleScrollArrowVisibility();
  });
  React.useImperativeHandle(scrollHandlerRef, () => handleScroll, [handleScroll]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    }
  });
  const state = React.useMemo(() => ({
    open,
    transitionStatus,
    side,
    align
  }), [open, transitionStatus, side, align]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!positionerElement || !popupRef.current || Object.keys(originalPositionerStylesRef.current).length) {
      return;
    }
    originalPositionerStylesRef.current = {
      top: positionerElement.style.top || '0',
      left: positionerElement.style.left || '0',
      right: positionerElement.style.right,
      height: positionerElement.style.height,
      bottom: positionerElement.style.bottom,
      minHeight: positionerElement.style.minHeight,
      maxHeight: positionerElement.style.maxHeight,
      marginTop: positionerElement.style.marginTop,
      marginBottom: positionerElement.style.marginBottom
    };
  }, [popupRef, positionerElement]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (open || alignItemWithTriggerActive) {
      return;
    }
    initialPlacedRef.current = false;
    reachedMaxHeightRef.current = false;
    initialHeightRef.current = 0;
    maxHeightRef.current = 0;
    (0, _utils.clearStyles)(positionerElement, originalPositionerStylesRef.current);
  }, [open, alignItemWithTriggerActive, positionerElement, popupRef]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const popupElement = popupRef.current;
    if (!open || !triggerElement || !positionerElement || !popupElement || store.state.transitionStatus === 'ending') {
      return;
    }
    if (!alignItemWithTriggerActive) {
      initialPlacedRef.current = true;
      scrollArrowFrame.request(handleScrollArrowVisibility);
      popupElement.style.removeProperty('--transform-origin');
      return;
    }

    // Wait for `selectedItemTextRef.current` to be set.
    queueMicrotask(() => {
      // Ensure we remove any transforms that can affect the location of the popup
      // and therefore the calculations.
      const restoreTransformStyles = unsetTransformStyles(popupElement);
      popupElement.style.removeProperty('--transform-origin');
      try {
        const positionerStyles = getComputedStyle(positionerElement);
        const popupStyles = getComputedStyle(popupElement);
        const doc = (0, _owner.ownerDocument)(triggerElement);
        const win = (0, _owner.ownerWindow)(positionerElement);
        const triggerRect = triggerElement.getBoundingClientRect();
        const positionerRect = positionerElement.getBoundingClientRect();
        const triggerX = triggerRect.left;
        const triggerHeight = triggerRect.height;
        const scroller = listElement || popupElement;
        const scrollHeight = scroller.scrollHeight;
        const borderBottom = parseFloat(popupStyles.borderBottomWidth);
        const marginTop = parseFloat(positionerStyles.marginTop) || 10;
        const marginBottom = parseFloat(positionerStyles.marginBottom) || 10;
        const minHeight = parseFloat(positionerStyles.minHeight) || 100;
        const maxPopupHeight = getMaxPopupHeight(popupStyles);
        const paddingLeft = 5;
        const paddingRight = 5;
        const triggerCollisionThreshold = 20;
        const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
        const viewportWidth = doc.documentElement.clientWidth;
        const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerHeight;
        const textElement = selectedItemTextRef.current;
        const valueElement = valueRef.current;
        let textRect;
        let offsetX = 0;
        let offsetY = 0;
        if (textElement && valueElement) {
          const valueRect = valueElement.getBoundingClientRect();
          textRect = textElement.getBoundingClientRect();
          const valueLeftFromTriggerLeft = valueRect.left - triggerX;
          const textLeftFromPositionerLeft = textRect.left - positionerRect.left;
          const valueCenterFromPositionerTop = valueRect.top - triggerRect.top + valueRect.height / 2;
          const textCenterFromTriggerTop = textRect.top - positionerRect.top + textRect.height / 2;
          offsetX = valueLeftFromTriggerLeft - textLeftFromPositionerLeft;
          offsetY = textCenterFromTriggerTop - valueCenterFromPositionerTop;
        }
        const idealHeight = availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom;
        let height = Math.min(viewportHeight, idealHeight);
        const maxHeight = viewportHeight - marginTop - marginBottom;
        const scrollTop = idealHeight - height;
        const left = Math.max(paddingLeft, triggerX + offsetX);
        const maxRight = viewportWidth - paddingRight;
        const rightOverflow = Math.max(0, left + positionerRect.width - maxRight);
        positionerElement.style.left = `${left - rightOverflow}px`;
        positionerElement.style.height = `${height}px`;
        positionerElement.style.maxHeight = 'auto';
        positionerElement.style.marginTop = `${marginTop}px`;
        positionerElement.style.marginBottom = `${marginBottom}px`;
        popupElement.style.height = '100%';
        const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
        const isTopPositioned = scrollTop >= maxScrollTop;
        if (isTopPositioned) {
          height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
        }

        // When the trigger is too close to the top or bottom of the viewport, or the minHeight is
        // reached, we fallback to aligning the popup to the trigger as the UX is poor otherwise.
        const fallbackToAlignPopupToTrigger = triggerRect.top < triggerCollisionThreshold || triggerRect.bottom > viewportHeight - triggerCollisionThreshold || height < Math.min(scrollHeight, minHeight);

        // Safari doesn't position the popup correctly when pinch-zoomed.
        const isPinchZoomed = (win.visualViewport?.scale ?? 1) !== 1 && _detectBrowser.isWebKit;
        if (fallbackToAlignPopupToTrigger || isPinchZoomed) {
          initialPlacedRef.current = true;
          (0, _utils.clearStyles)(positionerElement, originalPositionerStylesRef.current);
          ReactDOM.flushSync(() => setControlledAlignItemWithTrigger(false));
          return;
        }
        if (isTopPositioned) {
          const topOffset = Math.max(0, viewportHeight - idealHeight);
          positionerElement.style.top = positionerRect.height >= maxHeight ? '0' : `${topOffset}px`;
          positionerElement.style.height = `${height}px`;
          scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight;
          initialHeightRef.current = Math.max(minHeight, height);
        } else {
          positionerElement.style.bottom = '0';
          initialHeightRef.current = Math.max(minHeight, height);
          scroller.scrollTop = scrollTop;
        }
        if (textRect) {
          const popupTop = positionerRect.top;
          const popupHeight = positionerRect.height;
          const textCenterY = textRect.top + textRect.height / 2;
          const transformOriginY = popupHeight > 0 ? (textCenterY - popupTop) / popupHeight * 100 : 50;
          const clampedY = (0, _clamp.clamp)(transformOriginY, 0, 100);
          popupElement.style.setProperty('--transform-origin', `50% ${clampedY}%`);
        }
        if (initialHeightRef.current === viewportHeight || height >= maxPopupHeight) {
          reachedMaxHeightRef.current = true;
        }
        handleScrollArrowVisibility();

        // Avoid the `onScroll` event logic from triggering before the popup is placed.
        setTimeout(() => {
          initialPlacedRef.current = true;
        });
      } finally {
        restoreTransformStyles();
      }
    });
  }, [store, open, positionerElement, triggerElement, valueRef, selectedItemTextRef, popupRef, handleScrollArrowVisibility, alignItemWithTriggerActive, setControlledAlignItemWithTrigger, scrollArrowFrame, scrollDownArrowRef, scrollUpArrowRef, listElement]);
  React.useEffect(() => {
    if (!alignItemWithTriggerActive || !positionerElement || !open) {
      return undefined;
    }
    const win = (0, _owner.ownerWindow)(positionerElement);
    function handleResize(event) {
      setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.windowResize, event));
    }
    win.addEventListener('resize', handleResize);
    return () => {
      win.removeEventListener('resize', handleResize);
    };
  }, [setOpen, alignItemWithTriggerActive, positionerElement, open]);
  const defaultProps = {
    ...(listElement ? {
      role: 'presentation',
      'aria-orientation': undefined
    } : {
      role: 'listbox',
      'aria-multiselectable': multiple || undefined,
      id: `${id}-list`
    }),
    onKeyDown(event) {
      keyboardActiveRef.current = true;
      if (insideToolbar && _composite.COMPOSITE_KEYS.has(event.key)) {
        event.stopPropagation();
      }
    },
    onMouseMove() {
      keyboardActiveRef.current = false;
    },
    onPointerLeave(event) {
      if (!highlightItemOnHover || (0, _isMouseWithinBounds.isMouseWithinBounds)(event) || event.pointerType === 'touch') {
        return;
      }
      const popup = event.currentTarget;
      highlightTimeout.start(0, () => {
        store.set('activeIndex', null);
        popup.focus({
          preventScroll: true
        });
      });
    },
    onScroll(event) {
      if (listElement) {
        return;
      }
      scrollHandlerRef.current?.(event.currentTarget);
    },
    ...(alignItemWithTriggerActive && {
      style: listElement ? {
        height: '100%'
      } : _utils.LIST_FUNCTIONAL_STYLES
    })
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, popupRef],
    state,
    stateAttributesMapping,
    props: [popupProps, defaultProps, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), {
      className: !listElement && alignItemWithTriggerActive ? _styles.styleDisableScrollbar.className : undefined
    }, elementProps]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [!disableStyleElements && _styles.styleDisableScrollbar.getElement(nonce), /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingFocusManager, {
      context: floatingRootContext,
      modal: false,
      disabled: !mounted,
      restoreFocus: true,
      children: element
    })]
  });
});
if (process.env.NODE_ENV !== "production") SelectPopup.displayName = "SelectPopup";
function getMaxPopupHeight(popupStyles) {
  const maxHeightStyle = popupStyles.maxHeight || '';
  return maxHeightStyle.endsWith('px') ? parseFloat(maxHeightStyle) || Infinity : Infinity;
}
const UNSET_TRANSFORM_STYLES = {
  transform: 'none',
  scale: '1',
  translate: '0 0'
};
function restoreInlineStyleProperty(style, property, value) {
  if (value) {
    style.setProperty(property, value);
  } else {
    style.removeProperty(property);
  }
}
function unsetTransformStyles(popupElement) {
  const {
    style
  } = popupElement;
  const originalStyles = {};
  const props = Object.keys(UNSET_TRANSFORM_STYLES);
  for (const prop of props) {
    originalStyles[prop] = style.getPropertyValue(prop);
    style.setProperty(prop, UNSET_TRANSFORM_STYLES[prop]);
  }
  return () => {
    for (const prop of props) {
      restoreInlineStyleProperty(style, prop, originalStyles[prop]);
    }
  };
}