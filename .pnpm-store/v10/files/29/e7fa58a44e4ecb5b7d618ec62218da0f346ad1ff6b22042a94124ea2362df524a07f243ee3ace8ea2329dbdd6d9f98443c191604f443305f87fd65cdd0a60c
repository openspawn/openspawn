import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { type DialogRoot } from "../root/DialogRoot.js";
import { PopupStoreContext, PopupStoreState } from "../../utils/popups/index.js";
export type State<Payload> = PopupStoreState<Payload> & {
  modal: boolean | 'trap-focus';
  disablePointerDismissal: boolean;
  openMethod: InteractionType | null;
  nested: boolean;
  nestedOpenDialogCount: number;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  viewportElement: HTMLElement | null;
  role: 'dialog' | 'alertdialog';
};
type Context = PopupStoreContext<DialogRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  readonly onNestedDialogOpen?: (ownChildrenCount: number) => void;
  readonly onNestedDialogClose?: () => void;
};
declare const selectors: {
  modal: (state: State<unknown>) => boolean | "trap-focus";
  nested: (state: State<unknown>) => boolean;
  nestedOpenDialogCount: (state: State<unknown>) => number;
  disablePointerDismissal: (state: State<unknown>) => boolean;
  openMethod: (state: State<unknown>) => InteractionType | null;
  descriptionElementId: (state: State<unknown>) => string | undefined;
  titleElementId: (state: State<unknown>) => string | undefined;
  viewportElement: (state: State<unknown>) => HTMLElement | null;
  role: (state: State<unknown>) => "dialog" | "alertdialog";
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
export declare class DialogStore<Payload> extends ReactStore<Readonly<State<Payload>>, Context, typeof selectors> {
  constructor(initialState?: Partial<State<Payload>>);
  setOpen: (nextOpen: boolean, eventDetails: Omit<DialogRoot.ChangeEventDetails, "preventUnmountOnClose">) => void;
}
export {};