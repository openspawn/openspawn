import * as React from 'react';
import { type CompositeMetadata } from "../list/CompositeList.js";
import type { BaseUIComponentProps } from "../../utils/types.js";
import type { Dimensions, ModifierKey } from "../composite.js";
import { StateAttributesMapping } from "../../utils/getStateAttributesProps.js";
/**
 * @internal
 */
export declare function CompositeRoot<Metadata extends {}, State extends Record<string, any>>(componentProps: CompositeRoot.Props<Metadata, State>): import("react/jsx-runtime").JSX.Element;
export interface CompositeRootProps<Metadata, State extends Record<string, any>> extends Pick<BaseUIComponentProps<'div', State>, 'render' | 'className' | 'children'> {
  props?: Array<Record<string, any> | (() => Record<string, any>)>;
  state?: State;
  stateAttributesMapping?: StateAttributesMapping<State>;
  refs?: React.Ref<HTMLElement | null>[];
  tag?: keyof React.JSX.IntrinsicElements;
  orientation?: 'horizontal' | 'vertical' | 'both';
  cols?: number;
  loopFocus?: boolean;
  highlightedIndex?: number;
  onHighlightedIndexChange?: (index: number) => void;
  itemSizes?: Dimensions[];
  dense?: boolean;
  enableHomeAndEndKeys?: boolean;
  onMapChange?: (newMap: Map<Node, CompositeMetadata<Metadata> | null>) => void;
  stopEventPropagation?: boolean;
  rootRef?: React.RefObject<HTMLElement | null>;
  disabledIndices?: number[];
  modifierKeys?: ModifierKey[];
  highlightItemOnHover?: boolean;
}
export declare namespace CompositeRoot {
  type Props<Metadata, State extends Record<string, any>> = CompositeRootProps<Metadata, State>;
}