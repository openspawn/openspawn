"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogRoot = DialogRoot;
var React = _interopRequireWildcard(require("react"));
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _useDialogRoot = require("./useDialogRoot");
var _DialogRootContext = require("./DialogRootContext");
var _DialogStore = require("../store/DialogStore");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all parts of the dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
function DialogRoot(props) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    disablePointerDismissal = false,
    modal = true,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null
  } = props;
  const parentDialogRootContext = (0, _DialogRootContext.useDialogRootContext)(true);
  const nested = Boolean(parentDialogRootContext);
  const store = (0, _useRefWithInit.useRefWithInit)(() => {
    return handle?.store ?? new _DialogStore.DialogStore({
      open: openProp ?? defaultOpen,
      activeTriggerId: triggerIdProp !== undefined ? triggerIdProp : defaultTriggerIdProp,
      modal,
      disablePointerDismissal,
      nested
    });
  }).current;
  store.useControlledProp('open', openProp, defaultOpen);
  store.useControlledProp('activeTriggerId', triggerIdProp, defaultTriggerIdProp);
  store.useSyncedValues({
    disablePointerDismissal,
    nested,
    modal
  });
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);
  const payload = store.useState('payload');
  (0, _useDialogRoot.useDialogRoot)({
    store,
    actionsRef,
    parentContext: parentDialogRootContext?.store.context,
    onOpenChange,
    triggerIdProp
  });
  const contextValue = React.useMemo(() => ({
    store
  }), [store]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_DialogRootContext.DialogRootContext.Provider, {
    value: contextValue,
    children: typeof children === 'function' ? children({
      payload
    }) : children
  });
}