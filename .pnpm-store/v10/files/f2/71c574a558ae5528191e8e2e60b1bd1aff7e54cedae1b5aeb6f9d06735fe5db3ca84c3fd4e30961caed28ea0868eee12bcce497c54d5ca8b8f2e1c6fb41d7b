import * as React from 'react';
import type { BaseUIComponentProps } from "../../utils/types.js";
import { StateAttributesMapping } from "../../utils/getStateAttributesProps.js";
/**
 * @internal
 */
export declare function CompositeItem<Metadata, State extends Record<string, any>>(componentProps: CompositeItem.Props<Metadata, State>): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
export interface CompositeItemProps<Metadata, State extends Record<string, any>> extends Pick<BaseUIComponentProps<any, State>, 'render' | 'className'> {
  children?: React.ReactNode;
  metadata?: Metadata;
  refs?: React.Ref<HTMLElement | null>[];
  props?: Array<Record<string, any> | (() => Record<string, any>)>;
  state?: State;
  stateAttributesMapping?: StateAttributesMapping<State>;
  tag?: keyof React.JSX.IntrinsicElements;
}
export declare namespace CompositeItem {
  type Props<Metadata, State extends Record<string, any>> = CompositeItemProps<Metadata, State>;
}