import type { ToastManagerAddOptions, ToastManagerPromiseOptions, ToastManagerUpdateOptions } from "./useToastManager.js";
/**
 * Creates a new toast manager.
 */
export declare function createToastManager(): ToastManager;
export interface ToastManager {
  ' subscribe': (listener: (data: ToastManagerEvent) => void) => () => void;
  add: <Data extends object>(options: ToastManagerAddOptions<Data>) => string;
  close: (id: string) => void;
  update: <Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data>) => void;
  promise: <Value, Data extends object>(promiseValue: Promise<Value>, options: ToastManagerPromiseOptions<Value, Data>) => Promise<Value>;
}
export interface ToastManagerEvent {
  action: 'add' | 'close' | 'update' | 'promise';
  options: any;
}