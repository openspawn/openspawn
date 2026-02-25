import * as React from 'react';
import type { ComponentRenderFn, HTMLProps } from "./types.js";
import { StateAttributesMapping } from "./getStateAttributesProps.js";
type IntrinsicTagName = keyof React.JSX.IntrinsicElements;
/**
 * Renders a Base UI element.
 *
 * @param element The default HTML element to render. Can be overridden by the `render` prop.
 * @param componentProps An object containing the `render` and `className` props to be used for element customization. Other props are ignored.
 * @param params Additional parameters for rendering the element.
 */
export declare function useRenderElement<State extends Record<string, any>, RenderedElementType extends Element, TagName extends IntrinsicTagName | undefined, Enabled extends boolean | undefined = undefined>(element: TagName, componentProps: useRenderElement.ComponentProps<State>, params?: useRenderElement.Parameters<State, RenderedElementType, TagName, Enabled>): Enabled extends false ? null : React.ReactElement;
type RenderFunctionProps<TagName> = TagName extends keyof React.JSX.IntrinsicElements ? React.JSX.IntrinsicElements[TagName] : React.HTMLAttributes<any>;
export type UseRenderElementParameters<State, RenderedElementType extends Element, TagName, Enabled extends boolean | undefined> = {
  /**
   * If `false`, the hook will skip most of its internal logic and return `null`.
   * This is useful for rendering a component conditionally.
   * @default true
   */
  enabled?: Enabled;
  /**
   * @deprecated
   */
  propGetter?: (externalProps: HTMLProps) => HTMLProps;
  /**
   * The ref to apply to the rendered element.
   */
  ref?: React.Ref<RenderedElementType> | (React.Ref<RenderedElementType> | undefined)[];
  /**
   * The state of the component.
   */
  state?: State;
  /**
   * Intrinsic props to be spread on the rendered element.
   */
  props?: RenderFunctionProps<TagName> | Array<RenderFunctionProps<TagName> | undefined | ((props: RenderFunctionProps<TagName>) => RenderFunctionProps<TagName>)>;
  /**
   * A mapping of state to `data-*` attributes.
   */
  stateAttributesMapping?: StateAttributesMapping<State>;
};
export interface UseRenderElementComponentProps<State> {
  /**
   * The class name to apply to the rendered element.
   * Can be a string or a function that accepts the state and returns a string.
   */
  className?: string | ((state: State) => string | undefined);
  /**
   * The render prop or React element to override the default element.
   */
  render?: undefined | ComponentRenderFn<React.HTMLAttributes<any>, State> | React.ReactElement;
  /**
   * The style to apply to the rendered element.
   * Can be a style object or a function that accepts the state and returns a style object.
   */
  style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined);
}
export declare namespace useRenderElement {
  type Parameters<State, RenderedElementType extends Element, TagName, Enabled extends boolean | undefined> = UseRenderElementParameters<State, RenderedElementType, TagName, Enabled>;
  type ComponentProps<State> = UseRenderElementComponentProps<State>;
}
export {};