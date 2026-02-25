import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ToastViewportContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToastViewportContext.displayName = "ToastViewportContext";
export function useToastViewportContext() {
  const context = React.useContext(ToastViewportContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ToastViewportContext is missing. Toast parts must be placed within <Toast.Viewport>.' : _formatErrorMessage(67));
  }
  return context;
}