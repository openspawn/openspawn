'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
import { ToastContext } from "./provider/ToastProviderContext.js";
/**
 * Returns the array of toasts and methods to manage them.
 */
export function useToastManager() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: useToastManager must be used within <Toast.Provider>.' : _formatErrorMessage(73));
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