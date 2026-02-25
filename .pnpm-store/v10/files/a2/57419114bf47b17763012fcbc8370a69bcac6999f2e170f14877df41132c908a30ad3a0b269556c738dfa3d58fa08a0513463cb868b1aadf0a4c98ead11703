"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useToastManager = useToastManager;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
var _ToastProviderContext = require("./provider/ToastProviderContext");
/**
 * Returns the array of toasts and methods to manage them.
 */
function useToastManager() {
  const context = React.useContext(_ToastProviderContext.ToastContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: useToastManager must be used within <Toast.Provider>.' : (0, _formatErrorMessage2.default)(73));
  }
  const {
    toasts,
    add,
    close,
    update,
    promise
  } = context;
  return React.useMemo(() => ({
    toasts,
    add,
    close,
    update,
    promise
  }), [toasts, add, close, update, promise]);
}