"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _owner = require("@base-ui/utils/owner");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _utils = require("../../floating-ui-react/utils");
var _FocusGuard = require("../../utils/FocusGuard");
var _ToastViewportContext = require("./ToastViewportContext");
var _ToastProviderContext = require("../provider/ToastProviderContext");
var _useRenderElement = require("../../utils/useRenderElement");
var _focusVisible = require("../utils/focusVisible");
var _ToastViewportCssVars = require("./ToastViewportCssVars");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A container viewport for toasts.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastViewport = exports.ToastViewport = /*#__PURE__*/React.forwardRef(function ToastViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    children,
    ...elementProps
  } = componentProps;
  const {
    toasts,
    pauseTimers,
    resumeTimers,
    setHovering,
    setFocused,
    viewportRef,
    windowFocusedRef,
    prevFocusElement,
    setPrevFocusElement,
    expanded,
    focused
  } = (0, _ToastProviderContext.useToastContext)();
  const handlingFocusGuardRef = React.useRef(false);
  const markedReadyForMouseLeaveRef = React.useRef(false);
  const numToasts = toasts.length;
  const frontmostHeight = toasts[0]?.height ?? 0;
  const hasTransitioningToasts = React.useMemo(() => toasts.some(toast => toast.transitionStatus === 'ending'), [toasts]);

  // Listen globally for F6 so we can force-focus the viewport.
  React.useEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }
    function handleGlobalKeyDown(event) {
      if (numToasts === 0) {
        return;
      }
      if (event.key === 'F6' && event.target !== viewportRef.current) {
        event.preventDefault();
        setPrevFocusElement((0, _utils.activeElement)((0, _owner.ownerDocument)(viewportRef.current)));
        viewportRef.current?.focus({
          preventScroll: true
        });
        pauseTimers();
        setFocused(true);
      }
    }
    const win = (0, _owner.ownerWindow)(viewportRef.current);
    win.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      win.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [pauseTimers, setFocused, setPrevFocusElement, numToasts, viewportRef]);
  React.useEffect(() => {
    if (!viewportRef.current || !numToasts) {
      return undefined;
    }
    const win = (0, _owner.ownerWindow)(viewportRef.current);
    function handleWindowBlur(event) {
      if (event.target !== win) {
        return;
      }
      windowFocusedRef.current = false;
      pauseTimers();
    }
    function handleWindowFocus(event) {
      if (event.relatedTarget || event.target === win) {
        return;
      }
      const target = (0, _utils.getTarget)(event);
      const activeEl = (0, _utils.activeElement)((0, _owner.ownerDocument)(viewportRef.current));
      if (!(0, _utils.contains)(viewportRef.current, target) || !(0, _focusVisible.isFocusVisible)(activeEl)) {
        resumeTimers();
      }

      // Wait for the `handleFocus` event to fire.
      setTimeout(() => {
        windowFocusedRef.current = true;
      });
    }
    win.addEventListener('blur', handleWindowBlur, true);
    win.addEventListener('focus', handleWindowFocus, true);
    return () => {
      win.removeEventListener('blur', handleWindowBlur, true);
      win.removeEventListener('focus', handleWindowFocus, true);
    };
  }, [pauseTimers, resumeTimers, viewportRef, windowFocusedRef, setFocused,
  // `viewportRef.current` isn't available on the first render,
  // since the portal node hasn't yet been created.
  // By adding this dependency, we ensure the window listeners
  // are added when toasts have been created, once the ref is available.
  numToasts]);
  React.useEffect(() => {
    const viewportNode = viewportRef.current;
    if (!viewportNode || numToasts === 0) {
      return undefined;
    }
    const doc = (0, _owner.ownerDocument)(viewportNode);
    function handlePointerDown(event) {
      if (event.pointerType !== 'touch') {
        return;
      }
      const target = (0, _utils.getTarget)(event);
      if ((0, _utils.contains)(viewportNode, target)) {
        return;
      }
      resumeTimers();
      setHovering(false);
      setFocused(false);
    }
    doc.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      doc.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [numToasts, resumeTimers, setFocused, setHovering, viewportRef]);
  function handleFocusGuard(event) {
    if (!viewportRef.current) {
      return;
    }
    handlingFocusGuardRef.current = true;

    // If we're coming off the container, move to the first toast
    if (event.relatedTarget === viewportRef.current) {
      toasts[0]?.ref?.current?.focus();
    } else {
      prevFocusElement?.focus({
        preventScroll: true
      });
    }
  }
  function handleKeyDown(event) {
    if (event.key === 'Tab' && event.shiftKey && event.target === viewportRef.current) {
      event.preventDefault();
      prevFocusElement?.focus({
        preventScroll: true
      });
      resumeTimers();
    }
  }
  React.useEffect(() => {
    if (!windowFocusedRef.current || hasTransitioningToasts || !markedReadyForMouseLeaveRef.current) {
      return;
    }

    // Once transitions have finished, see if a mouseleave was already triggered
    // but blocked from taking effect. If so, we can now safely resume timers and
    // collapse the viewport.
    resumeTimers();
    setHovering(false);
    markedReadyForMouseLeaveRef.current = false;
  }, [hasTransitioningToasts, resumeTimers, setHovering, windowFocusedRef]);
  function handleMouseEnter() {
    pauseTimers();
    setHovering(true);
    markedReadyForMouseLeaveRef.current = false;
  }
  function handleMouseLeave() {
    if (toasts.some(toast => toast.transitionStatus === 'ending')) {
      // When swiping to dismiss, wait until the transitions have settled
      // to avoid the viewport collapsing while the user is interacting.
      markedReadyForMouseLeaveRef.current = true;
    } else {
      resumeTimers();
      setHovering(false);
    }
  }
  function handleFocus() {
    if (handlingFocusGuardRef.current) {
      handlingFocusGuardRef.current = false;
      return;
    }
    if (focused) {
      return;
    }

    // Only set focused when the active element is focus-visible.
    // This prevents the viewport from staying expanded when clicking inside without
    // keyboard navigation.
    if ((0, _focusVisible.isFocusVisible)((0, _owner.ownerDocument)(viewportRef.current).activeElement)) {
      setFocused(true);
      pauseTimers();
    }
  }
  function handleBlur(event) {
    if (!focused || (0, _utils.contains)(viewportRef.current, event.relatedTarget)) {
      return;
    }
    setFocused(false);
    resumeTimers();
  }
  const defaultProps = {
    tabIndex: -1,
    role: 'region',
    'aria-live': 'polite',
    'aria-atomic': false,
    'aria-relevant': 'additions text',
    'aria-label': 'Notifications',
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onClick: handleFocus
  };
  const state = React.useMemo(() => ({
    expanded
  }), [expanded]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, viewportRef],
    state,
    props: [defaultProps, {
      style: {
        [_ToastViewportCssVars.ToastViewportCssVars.frontmostHeight]: frontmostHeight ? `${frontmostHeight}px` : undefined
      }
    }, elementProps, {
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
        children: [numToasts > 0 && prevFocusElement && /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
          onFocus: handleFocusGuard
        }), children, numToasts > 0 && prevFocusElement && /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
          onFocus: handleFocusGuard
        })]
      })
    }]
  });
  const contextValue = React.useMemo(() => ({
    viewportRef
  }), [viewportRef]);
  const highPriorityToasts = React.useMemo(() => toasts.filter(toast => toast.priority === 'high'), [toasts]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_ToastViewportContext.ToastViewportContext.Provider, {
    value: contextValue,
    children: [numToasts > 0 && prevFocusElement && /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
      onFocus: handleFocusGuard
    }), element, !focused && highPriorityToasts.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      style: _visuallyHidden.visuallyHidden,
      children: highPriorityToasts.map(toast => /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        role: "alert",
        "aria-atomic": true,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          children: toast.title
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          children: toast.description
        })]
      }, toast.id))
    })]
  });
});
if (process.env.NODE_ENV !== "production") ToastViewport.displayName = "ToastViewport";