import * as React from 'react';
import type { ToastObject, ToastManagerAddOptions, ToastManagerPromiseOptions, ToastManagerUpdateOptions } from "../useToastManager.js";
export interface ToastContextValue<Data extends object> {
  toasts: ToastObject<Data>[];
  setToasts: React.Dispatch<React.SetStateAction<ToastObject<Data>[]>>;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  expanded: boolean;
  add: (options: ToastManagerAddOptions<Data>) => string;
  update: (id: string, options: ToastManagerUpdateOptions<Data>) => void;
  promise: <Value>(value: Promise<Value>, options: ToastManagerPromiseOptions<Value, Data>) => Promise<Value>;
  close: (id: string) => void;
  pauseTimers: () => void;
  resumeTimers: () => void;
  remove: (id: string) => void;
  prevFocusElement: HTMLElement | null;
  setPrevFocusElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  viewportRef: React.RefObject<HTMLElement | null>;
  windowFocusedRef: React.RefObject<boolean>;
  scheduleTimer: (id: string, delay: number, callback: () => void) => void;
}
export type ToastContext<Data extends object> = ToastContextValue<Data>;
export declare const ToastContext: React.Context<ToastContext<any> | undefined>;
export declare function useToastContext(): ToastContext<any>;