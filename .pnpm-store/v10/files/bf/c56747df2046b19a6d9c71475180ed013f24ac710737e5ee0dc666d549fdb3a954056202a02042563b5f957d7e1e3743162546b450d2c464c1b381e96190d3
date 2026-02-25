"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastViewportContext = void 0;
exports.useToastViewportContext = useToastViewportContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ToastViewportContext = exports.ToastViewportContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToastViewportContext.displayName = "ToastViewportContext";
function useToastViewportContext() {
  const context = React.useContext(ToastViewportContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ToastViewportContext is missing. Toast parts must be placed within <Toast.Viewport>.' : (0, _formatErrorMessage2.default)(67));
  }
  return context;
}