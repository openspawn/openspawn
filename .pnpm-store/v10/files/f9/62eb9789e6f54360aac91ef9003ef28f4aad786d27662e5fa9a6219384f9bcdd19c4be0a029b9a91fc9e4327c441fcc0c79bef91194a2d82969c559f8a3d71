"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipTrigger = void 0;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
var _TooltipRootContext = require("../root/TooltipRootContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../utils/useRenderElement");
var _popups = require("../../utils/popups");
var _useBaseUiId = require("../../utils/useBaseUiId");
var _TooltipProviderContext = require("../provider/TooltipProviderContext");
var _floatingUiReact = require("../../floating-ui-react");
var _constants = require("../utils/constants");
/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipTrigger = exports.TooltipTrigger = /*#__PURE__*/React.forwardRef(function TooltipTrigger(componentProps, forwardedRef) {
  const {
    className,
    render,
    handle,
    payload,
    disabled: disabledProp,
    delay,
    closeDelay,
    id: idProp,
    ...elementProps
  } = componentProps;
  const rootContext = (0, _TooltipRootContext.useTooltipRootContext)(true);
  const store = handle?.store ?? rootContext;
  if (!store) {
    throw /* FIXME (minify-errors-in-prod): Unminifyable error in production! */new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Tooltip.Trigger> must be either used within a <Tooltip.Root> component or provided with a handle.' : (0, _formatErrorMessage2.default)(82));
  }
  const thisTriggerId = (0, _useBaseUiId.useBaseUiId)(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const floatingRootContext = store.useState('floatingRootContext');
  const triggerElementRef = React.useRef(null);
  const delayWithDefault = delay ?? _constants.OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = (0, _popups.useTriggerDataForwarding)(thisTriggerId, triggerElementRef, store, {
    payload,
    closeDelay: closeDelayWithDefault
  });
  const providerContext = (0, _TooltipProviderContext.useTooltipProviderContext)();
  const {
    delayRef,
    isInstantPhase,
    hasProvider
  } = (0, _floatingUiReact.useDelayGroup)(floatingRootContext, {
    open: isOpenedByThisTrigger
  });
  store.useSyncedValue('isInstantPhase', isInstantPhase);
  const rootDisabled = store.useState('disabled');
  const disabled = disabledProp ?? rootDisabled;
  const trackCursorAxis = store.useState('trackCursorAxis');
  const disableHoverablePopup = store.useState('disableHoverablePopup');
  const hoverProps = (0, _floatingUiReact.useHoverReferenceInteraction)(floatingRootContext, {
    enabled: !disabled,
    mouseOnly: true,
    move: false,
    handleClose: !disableHoverablePopup && trackCursorAxis !== 'both' ? (0, _floatingUiReact.safePolygon)() : null,
    restMs() {
      const providerDelay = providerContext?.delay;
      const groupOpenValue = typeof delayRef.current === 'object' ? delayRef.current.open : undefined;
      let computedRestMs = delayWithDefault;
      if (hasProvider) {
        if (groupOpenValue !== 0) {
          computedRestMs = delay ?? providerDelay ?? delayWithDefault;
        } else {
          computedRestMs = 0;
        }
      }
      return computedRestMs;
    },
    delay() {
      const closeValue = typeof delayRef.current === 'object' ? delayRef.current.close : undefined;
      let computedCloseDelay = closeDelayWithDefault;
      if (closeDelay == null && hasProvider) {
        computedCloseDelay = closeValue;
      }
      return {
        close: computedCloseDelay
      };
    },
    triggerElementRef,
    isActiveTrigger: isTriggerActive
  });
  const state = React.useMemo(() => ({
    open: isOpenedByThisTrigger
  }), [isOpenedByThisTrigger]);
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, triggerElementRef],
    props: [hoverProps, rootTriggerProps, {
      id: thisTriggerId
    }, elementProps],
    stateAttributesMapping: _popupStateMapping.triggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") TooltipTrigger.displayName = "TooltipTrigger";