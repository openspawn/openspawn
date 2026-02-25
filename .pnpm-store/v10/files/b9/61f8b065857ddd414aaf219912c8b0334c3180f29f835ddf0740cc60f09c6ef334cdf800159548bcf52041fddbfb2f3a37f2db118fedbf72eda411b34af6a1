"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LabelableProvider = void 0;
var React = _interopRequireWildcard(require("react"));
var _mergeProps = require("../merge-props");
var _useBaseUiId = require("../utils/useBaseUiId");
var _LabelableContext = require("./LabelableContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * @internal
 */
const LabelableProvider = exports.LabelableProvider = function LabelableProvider(props) {
  const defaultId = (0, _useBaseUiId.useBaseUiId)();
  const [controlId, setControlId] = React.useState(props.initialControlId === undefined ? defaultId : props.initialControlId);
  const [labelId, setLabelId] = React.useState(undefined);
  const [messageIds, setMessageIds] = React.useState([]);
  const {
    messageIds: parentMessageIds
  } = (0, _LabelableContext.useLabelableContext)();
  const getDescriptionProps = React.useCallback(externalProps => {
    return (0, _mergeProps.mergeProps)({
      'aria-describedby': parentMessageIds.concat(messageIds).join(' ') || undefined
    }, externalProps);
  }, [parentMessageIds, messageIds]);
  const contextValue = React.useMemo(() => ({
    controlId,
    setControlId,
    labelId,
    setLabelId,
    messageIds,
    setMessageIds,
    getDescriptionProps
  }), [controlId, setControlId, labelId, setLabelId, messageIds, setMessageIds, getDescriptionProps]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_LabelableContext.LabelableContext.Provider, {
    value: contextValue,
    children: props.children
  });
};
if (process.env.NODE_ENV !== "production") LabelableProvider.displayName = "LabelableProvider";