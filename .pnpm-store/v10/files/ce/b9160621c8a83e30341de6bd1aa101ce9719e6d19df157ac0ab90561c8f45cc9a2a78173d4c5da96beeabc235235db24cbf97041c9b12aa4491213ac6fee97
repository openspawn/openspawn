import type { FloatingContext, FloatingRootContext } from "../types.js";
import { FloatingTreeStore } from "../components/FloatingTreeStore.js";
export type UseHoverFloatingInteractionProps = {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  closeDelay?: number | (() => number);
  /**
   * An optional external floating tree to use instead of the default context.
   */
  externalTree?: FloatingTreeStore;
};
/**
 * Provides hover interactions that should be attached to the floating element.
 */
export declare function useHoverFloatingInteraction(context: FloatingRootContext | FloatingContext, parameters?: UseHoverFloatingInteractionProps): void;
export declare function getDelay(value: number | (() => number), pointerType?: PointerEvent['pointerType']): number;