import { FloatingTreeStore } from "../components/FloatingTreeStore.js";
import type { Delay, ElementProps, FloatingContext, FloatingRootContext, FloatingTreeType, SafePolygonOptions } from "../types.js";
export interface HandleCloseContext extends FloatingContext {
  onClose: () => void;
  tree?: FloatingTreeType | null;
  leave?: boolean;
}
export interface HandleClose {
  (context: HandleCloseContext): (event: MouseEvent) => void;
  __options?: SafePolygonOptions;
}
export declare function getDelay(value: UseHoverProps['delay'], prop: 'open' | 'close', pointerType?: PointerEvent['pointerType']): number | undefined;
export interface UseHoverProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * Accepts an event handler that runs on `mousemove` to control when the
   * floating element closes once the cursor leaves the reference element.
   * @default null
   */
  handleClose?: HandleClose | null;
  /**
   * Waits until the user’s cursor is at “rest” over the reference element
   * before changing the `open` state.
   * @default 0
   */
  restMs?: number | (() => number);
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  delay?: Delay | (() => Delay);
  /**
   * Whether the logic only runs for mouse input, ignoring touch input.
   * Note: due to a bug with Linux Chrome, "pen" inputs are considered "mouse".
   * @default false
   */
  mouseOnly?: boolean;
  /**
   * Whether moving the cursor over the floating element will open it, without a
   * regular hover event required.
   * @default true
   */
  move?: boolean;
  /**
   * Allows to override the element that will trigger the popup.
   * When it's set, useHover won't read the reference element from the root context.
   * This allows to have multiple triggers per floating element (assuming `useHover` is called per trigger).
   */
  triggerElement?: HTMLElement | null;
  /**
   * External FlatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore;
}
/**
 * Opens the floating element while hovering over the reference element, like
 * CSS `:hover`.
 * @see https://floating-ui.com/docs/useHover
 */
export declare function useHover(context: FloatingRootContext | FloatingContext, props?: UseHoverProps): ElementProps;