import * as React from 'react';
import type { TextDirection } from "../../direction-provider/DirectionContext.js";
import { type Dimensions, type ModifierKey } from "../composite.js";
import { CompositeMetadata } from "../list/CompositeList.js";
import { HTMLProps } from "../../utils/types.js";
export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical' | 'both';
  cols?: number;
  loopFocus?: boolean;
  highlightedIndex?: number;
  onHighlightedIndexChange?: (index: number) => void;
  dense?: boolean;
  direction: TextDirection;
  itemSizes?: Array<Dimensions>;
  rootRef?: React.Ref<Element>;
  /**
   * When `true`, pressing the Home key moves focus to the first item,
   * and pressing the End key moves focus to the last item.
   * @default false
   */
  enableHomeAndEndKeys?: boolean;
  /**
   * When `true`, keypress events on Composite's navigation keys
   * be stopped with event.stopPropagation().
   * @default false
   */
  stopEventPropagation?: boolean;
  /**
   * Array of item indices to be considered disabled.
   * Used for composite items that are focusable when disabled.
   */
  disabledIndices?: number[];
  /**
   * Array of [modifier key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#modifier_keys) that should allow normal keyboard actions
   * when pressed. By default, all modifier keys prevent normal actions.
   * @default []
   */
  modifierKeys?: ModifierKey[];
}
export declare function useCompositeRoot(params: UseCompositeRootParameters): {
  props: HTMLProps;
  highlightedIndex: number;
  onHighlightedIndexChange: (index: any, shouldScrollIntoView?: any) => void;
  elementsRef: React.RefObject<(HTMLDivElement | null)[]>;
  disabledIndices: number[] | undefined;
  onMapChange: (map: Map<Element, CompositeMetadata<any>>) => void;
  relayKeyboardEvent: React.KeyboardEventHandler<any>;
};