import type { ElementProps, FloatingContext, FloatingRootContext } from "../types.js";
export interface UseFocusProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether the open state only changes if the focus event is considered
   * visible (`:focus-visible` CSS selector).
   * @default true
   */
  visibleOnly?: boolean;
  /**
   * Waits for the specified time before opening.
   * @default undefined
   */
  delay?: number | (() => number | undefined);
}
/**
 * Opens the floating element while the reference element has focus, like CSS
 * `:focus`.
 * @see https://floating-ui.com/docs/useFocus
 */
export declare function useFocus(context: FloatingRootContext | FloatingContext, props?: UseFocusProps): ElementProps;