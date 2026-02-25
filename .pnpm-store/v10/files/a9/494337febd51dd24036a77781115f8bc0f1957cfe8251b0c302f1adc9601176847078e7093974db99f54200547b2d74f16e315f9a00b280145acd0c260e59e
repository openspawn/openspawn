import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
import { useMergedRefs, useMergedRefsN } from '@base-ui/utils/useMergedRefs';
import { getReactElementRef } from '@base-ui/utils/getReactElementRef';
import { mergeObjects } from '@base-ui/utils/mergeObjects';
import { getStateAttributesProps } from "./getStateAttributesProps.js";
import { resolveClassName } from "./resolveClassName.js";
import { resolveStyle } from "./resolveStyle.js";
import { mergeProps, mergePropsN, mergeClassNames } from "../merge-props/index.js";
import { EMPTY_OBJECT } from "./constants.js";
import { createElement as _createElement } from "react";
/**
 * Renders a Base UI element.
 *
 * @param element The default HTML element to render. Can be overridden by the `render` prop.
 * @param componentProps An object containing the `render` and `className` props to be used for element customization. Other props are ignored.
 * @param params Additional parameters for rendering the element.
 */
export function useRenderElement(element, componentProps, params = {}) {
  const renderProp = componentProps.render;
  const outProps = useRenderElementProps(componentProps, params);
  if (params.enabled === false) {
    return null;
  }
  const state = params.state ?? EMPTY_OBJECT;
  return evaluateRenderProp(element, renderProp, outProps, state);
}

/**
 * Computes render element final props.
 */
function useRenderElementProps(componentProps, params = {}) {
  const {
    className: classNameProp,
    style: styleProp,
    render: renderProp
  } = componentProps;
  const {
    state = EMPTY_OBJECT,
    ref,
    props,
    stateAttributesMapping,
    enabled = true
  } = params;
  const className = enabled ? resolveClassName(classNameProp, state) : undefined;
  const style = enabled ? resolveStyle(styleProp, state) : undefined;
  const stateProps = enabled ? getStateAttributesProps(state, stateAttributesMapping) : EMPTY_OBJECT;
  const outProps = enabled ? mergeObjects(stateProps, Array.isArray(props) ? mergePropsN(props) : props) ?? EMPTY_OBJECT : EMPTY_OBJECT;

  // SAFETY: The `useMergedRefs` functions use a single hook to store the same value,
  // switching between them at runtime is safe. If this assertion fails, React will
  // throw at runtime anyway.
  // This also skips the `useMergedRefs` call on the server, which is fine because
  // refs are not used on the server side.
  /* eslint-disable react-hooks/rules-of-hooks */
  if (typeof document !== 'undefined') {
    if (!enabled) {
      useMergedRefs(null, null);
    } else if (Array.isArray(ref)) {
      outProps.ref = useMergedRefsN([outProps.ref, getReactElementRef(renderProp), ...ref]);
    } else {
      outProps.ref = useMergedRefs(outProps.ref, getReactElementRef(renderProp), ref);
    }
  }
  if (!enabled) {
    return EMPTY_OBJECT;
  }
  if (className !== undefined) {
    outProps.className = mergeClassNames(outProps.className, className);
  }
  if (style !== undefined) {
    outProps.style = mergeObjects(outProps.style, style);
  }
  return outProps;
}
function evaluateRenderProp(element, render, props, state) {
  if (render) {
    if (typeof render === 'function') {
      return render(props, state);
    }
    const mergedProps = mergeProps(props, render.props);
    mergedProps.ref = props.ref;
    return /*#__PURE__*/React.cloneElement(render, mergedProps);
  }
  if (element) {
    if (typeof element === 'string') {
      return renderTag(element, props);
    }
  }
  // Unreachable, but the typings on `useRenderElement` need to be reworked
  // to annotate it correctly.
  throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: Render element or function are not defined.' : _formatErrorMessage(8));
}
function renderTag(Tag, props) {
  if (Tag === 'button') {
    return /*#__PURE__*/_createElement("button", {
      type: "button",
      ...props,
      key: props.key
    });
  }
  if (Tag === 'img') {
    return /*#__PURE__*/_createElement("img", {
      alt: "",
      ...props,
      key: props.key
    });
  }
  return /*#__PURE__*/React.createElement(Tag, props);
}