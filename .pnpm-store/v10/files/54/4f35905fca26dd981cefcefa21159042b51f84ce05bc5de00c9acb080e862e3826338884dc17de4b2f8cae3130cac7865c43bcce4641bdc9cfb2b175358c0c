import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { PopupStoreContext, PopupStoreState } from "../../utils/popups/index.js";
import { type PreviewCardRoot } from "../root/PreviewCardRoot.js";
export type State<Payload> = PopupStoreState<Payload> & {
  instantType: 'dismiss' | 'focus' | undefined;
  hasViewport: boolean;
};
export type Context = PopupStoreContext<PreviewCardRoot.ChangeEventDetails> & {
  closeDelayRef: React.RefObject<number>;
};
declare const selectors: {
  instantType: (state: State<unknown>) => "focus" | "dismiss" | undefined;
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
export declare class PreviewCardStore<Payload> extends ReactStore<Readonly<State<Payload>>, Context, typeof selectors> {
  constructor(initialState?: Partial<State<Payload>>);
  setOpen: (nextOpen: boolean, eventDetails: Omit<PreviewCardRoot.ChangeEventDetails, "preventUnmountOnClose">) => void;
  static useStore<Payload>(externalStore: PreviewCardStore<Payload> | undefined, initialState?: Partial<State<Payload>>): PreviewCardStore<Payload>;
}
export {};