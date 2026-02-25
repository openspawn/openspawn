import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { type TooltipRoot } from "../root/TooltipRoot.js";
import { PopupStoreContext, PopupStoreState } from "../../utils/popups/index.js";
export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  isInstantPhase: boolean;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  disableHoverablePopup: boolean;
  openChangeReason: TooltipRoot.ChangeEventReason | null;
  closeDelay: number;
  hasViewport: boolean;
};
export type Context = PopupStoreContext<TooltipRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
};
declare const selectors: {
  disabled: (state: State<unknown>) => boolean;
  instantType: (state: State<unknown>) => "delay" | "focus" | "dismiss" | undefined;
  isInstantPhase: (state: State<unknown>) => boolean;
  trackCursorAxis: (state: State<unknown>) => "none" | "both" | "x" | "y";
  disableHoverablePopup: (state: State<unknown>) => boolean;
  lastOpenChangeReason: (state: State<unknown>) => import("../index.js").TooltipRootChangeEventReason | null;
  closeDelay: (state: State<unknown>) => number;
  hasViewport: (state: State<unknown>) => boolean;
  open: (state: PopupStoreState<unknown>) => boolean;
  mounted: (state: PopupStoreState<unknown>) => boolean;
  transitionStatus: (state: PopupStoreState<unknown>) => import("../../utils/useTransitionStatus.js").TransitionStatus;
  floatingRootContext: (state: PopupStoreState<unknown>) => import("../../floating-ui-react/components/FloatingRootStore.js").FloatingRootStore;
  preventUnmountingOnClose: (state: PopupStoreState<unknown>) => boolean;
  payload: (state: PopupStoreState<unknown>) => unknown;
  activeTriggerId: (state: PopupStoreState<unknown>) => string | null;
  activeTriggerElement: (state: PopupStoreState<unknown>) => Element | null;
  isTriggerActive: (state: PopupStoreState<unknown>, triggerId: string | undefined) => boolean;
  isOpenedByTrigger: (state: PopupStoreState<unknown>, triggerId: string | undefined) => boolean;
  isMountedByTrigger: (state: PopupStoreState<unknown>, triggerId: string | undefined) => boolean;
  triggerProps: (state: PopupStoreState<unknown>, isActive: boolean) => import("../../index.js").HTMLProps;
  popupProps: (state: PopupStoreState<unknown>) => import("../../index.js").HTMLProps;
  popupElement: (state: PopupStoreState<unknown>) => HTMLElement | null;
  positionerElement: (state: PopupStoreState<unknown>) => HTMLElement | null;
};
export declare class TooltipStore<Payload> extends ReactStore<Readonly<State<Payload>>, Context, typeof selectors> {
  constructor(initialState?: Partial<State<Payload>>);
  setOpen: (nextOpen: boolean, eventDetails: Omit<TooltipRoot.ChangeEventDetails, "preventUnmountOnClose">) => void;
  static useStore<Payload>(externalStore: TooltipStore<Payload> | undefined, initialState?: Partial<State<Payload>>): TooltipStore<Payload>;
}
export {};