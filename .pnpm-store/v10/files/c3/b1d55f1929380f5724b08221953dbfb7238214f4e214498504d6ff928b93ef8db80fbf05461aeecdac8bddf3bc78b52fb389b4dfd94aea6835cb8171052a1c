"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRenderElement = useRenderElement;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _getReactElementRef = require("@base-ui/utils/getReactElementRef");
var _mergeObjects = require("@base-ui/utils/mergeObjects");
var _getStateAttributesProps = require("./getStateAttributesProps");
var _resolveClassName = require("./resolveClassName");
var _resolveStyle = require("./resolveStyle");
var _mergeProps = require("../merge-props");
var _constants = require("./constants");
/**
 * Renders a Base UI element.
 *
 * @param element The default HTML element to render. Can be overridden by the `render` prop.
 * @param componentProps An object containing the `render` and `className` props to be used for element customization. Other props are ignored.
 * @param params Additional parameters for rendering the element.
 */
function useRenderElement(element, componentProps, params = {}) {
  const renderProp = componentProps.render;
  const outProps = useRenderElementProps(componentProps, params);
  if (params.enabled === false) {
    return null;
  }
  const state = params.state ?? _constants.EMPTY_OBJECT;
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
    state = _constants.EMPTY_OBJECT,
    ref,
    props,
    stateAttributesMapping,
    enabled = true
  } = params;
  const className = enabled ? (0, _resolveClassName.resolveClassName)(classNameProp, state) : undefined;
  const style = enabled ? (0, _resolveStyle.resolveStyle)(styleProp, state) : undefined;
  const stateProps = enabled ? (0, _getStateAttributesProps.getStateAttributesProps)(state, stateAttributesMapping) : _constants.EMPTY_OBJECT;
  const outProps = enabled ? (0, _mergeObjects.mergeObjects)(stateProps, Array.isArray(props) ? (0, _mergeProps.mergePropsN)(props) : props) ?? _constants.EMPTY_OBJECT : _constants.EMPTY_OBJECT;

  // SAFETY: The `useMergedRefs` functions use a single hook to store the same value,
  // switching between them at runtime is safe. If this assertion fails, React will
  // throw at runtime anyway.
  // This also skips the `useMergedRefs` call on the server, which is fine because
  // refs are not used on the server side.
  /* eslint-disable react-hooks/rules-of-hooks */
  if (typeof document !== 'undefined') {
    if (!enabled) {
      (0, _useMergedRefs.useMergedRefs)(null, null);
    } else if (Array.isArray(ref)) {
      outProps.ref = (0, _useMergedRefs.useMergedRefsN)([outProps.ref, (0, _getReactElementRef.getReactElementRef)(renderProp), ...ref]);
    } else {
      outProps.ref = (0, _useMergedRefs.useMergedRefs)(outProps.ref, (0, _getReactElementRef.getReactElementRef)(renderProp), ref);
    }
  }
  if (!enabled) {
    return _constants.EMPTY_OBJECT;
  }
  if (className !== undefined) {
    outProps.className = (0, _mergeProps.mergeClassNames)(outProps.className, className);
  }
  if (style !== undefined) {
    outProps.style = (0, _mergeObjects.mergeObjects)(outProps.style, style);
  }
  return outProps;
}
function evaluateRenderProp(element, render, props, state) {
  if (render) {
    if (typeof render === 'function') {
      return render(props, state);
    }
    const mergedProps = (0, _mergeProps.mergeProps)(props, render.props);
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
  throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: Render element or function are not defined.' : (0, _formatErrorMessage2.default)(8));
}
function renderTag(Tag, props) {
  if (Tag === 'button') {
    return /*#__PURE__*/(0, _react.createElement)("button", {
      type: "button",
      ...props,
      key: props.key
    });
  }
  if (Tag === 'img') {
    return /*#__PURE__*/(0, _react.createElement)("img", {
      alt: "",
      ...props,
      key: props.key
    });
  }
  return /*#__PURE__*/React.createElement(Tag, props);
}