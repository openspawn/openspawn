import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { FloatingRootContext, SafePolygonOptions } from "../types.js";
export declare const safePolygonIdentifier: string;
export declare function isInteractiveElement(element: Element | null): boolean;
export interface HoverInteractionSharedState {
  pointerTypeRef: React.RefObject<string | undefined>;
  interactedInsideRef: React.RefObject<boolean>;
  handlerRef: React.RefObject<((event: MouseEvent) => void) | undefined>;
  blockMouseMoveRef: React.RefObject<boolean>;
  performedPointerEventsMutationRef: React.RefObject<boolean>;
  unbindMouseMoveRef: React.RefObject<() => void>;
  restTimeoutPendingRef: React.RefObject<boolean>;
  openChangeTimeout: ReturnType<typeof useTimeout>;
  restTimeout: ReturnType<typeof useTimeout>;
  handleCloseOptionsRef: React.RefObject<SafePolygonOptions | undefined>;
}
export declare function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteractionSharedState;