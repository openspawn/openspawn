import { FloatingRootContext } from "../../floating-ui-react/index.js";
import { TransitionStatus } from "../useTransitionStatus.js";
import { PopupTriggerMap } from "./popupTriggerMap.js";
import { HTMLProps } from "../types.js";
/**
 * State common to all popup stores.
 */
export type PopupStoreState<Payload> = {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the popup should be mounted in the DOM.
   * This usually follows `open` but can be different during exit transitions.
   */
  mounted: boolean;
  /**
   * The current enter/exit transition status of the popup.
   */
  transitionStatus: TransitionStatus;
  floatingRootContext: FloatingRootContext;
  /**
   * Whether to prevent unmounting the popup when closed.
   * Useful for interactling with JS animation libraries that control unmounting themselves.
   */
  preventUnmountingOnClose: boolean;
  /**
   * Optional payload set by the trigger.
   */
  payload: Payload | undefined;
  /**
   * ID of the currently active trigger.
   */
  activeTriggerId: string | null;
  /**
   * The currently active trigger DOM element.
   */
  activeTriggerElement: Element | null;
  /**
   * The popup DOM element.
   */
  popupElement: HTMLElement | null;
  /**
   * The positioner DOM element.
   */
  positionerElement: HTMLElement | null;
  /**
   * Props to spread onto the active trigger element.
   */
  activeTriggerProps: HTMLProps;
  /**
   * Props to spread onto inactive trigger elements.
   */
  inactiveTriggerProps: HTMLProps;
  /**
   * Props to spread onto the popup element.
   */
  popupProps: HTMLProps;
};
export declare function createInitialPopupStoreState<Payload>(): PopupStoreState<Payload>;
export type PopupStoreContext<ChangeEventDetails> = {
  /**
   * Map of registered trigger elements.
   */
  readonly triggerElements: PopupTriggerMap;
  /**
   * Reference to the popup element.
   */
  readonly popupRef: React.RefObject<HTMLElement | null>;
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?: (open: boolean, eventDetails: ChangeEventDetails) => void;
  /**
   * Callback fired when the open state change animation completes.
   */
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};
export declare const popupStoreSelectors: {
  open: (state: PopupStoreState<unknown>) => boolean;
  mounted: (state: PopupStoreState<unknown>) => boolean;
  transitionStatus: (state: PopupStoreState<unknown>) => TransitionStatus;
  floatingRootContext: (state: PopupStoreState<unknown>) => import("../../floating-ui-react/components/FloatingRootStore.js").FloatingRootStore;
  preventUnmountingOnClose: (state: PopupStoreState<unknown>) => boolean;
  payload: (state: PopupStoreState<unknown>) => unknown;
  activeTriggerId: (state: PopupStoreState<unknown>) => string | null;
  activeTriggerElement: (state: PopupStoreState<unknown>) => Element | null;
  /**
   * Whether the trigger with the given ID was used to open the popup.
   */
  isTriggerActive: (state: PopupStoreState<unknown>, triggerId: string | undefined) => boolean;
  /**
   * Whether the popup is open and was activated by a trigger with the given ID.
   */
  isOpenedByTrigger: (state: PopupStoreState<unknown>, triggerId: string | undefined) => boolean;
  /**
   * Whether the popup is mounted and was activated by a trigger with the given ID.
   */
  isMountedByTrigger: (state: PopupStoreState<unknown>, triggerId: string | undefined) => boolean;
  triggerProps: (state: PopupStoreState<unknown>, isActive: boolean) => HTMLProps;
  popupProps: (state: PopupStoreState<unknown>) => HTMLProps;
  popupElement: (state: PopupStoreState<unknown>) => HTMLElement | null;
  positionerElement: (state: PopupStoreState<unknown>) => HTMLElement | null;
};
export type PopupStoreSelectors = typeof popupStoreSelectors;