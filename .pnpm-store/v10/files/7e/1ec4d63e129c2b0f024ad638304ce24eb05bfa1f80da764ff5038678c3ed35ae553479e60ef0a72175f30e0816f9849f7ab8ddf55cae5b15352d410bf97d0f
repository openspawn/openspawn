'use client';

import * as React from 'react';
import { mergeProps } from "../merge-props/index.js";
import { useBaseUiId } from "../utils/useBaseUiId.js";
import { LabelableContext, useLabelableContext } from "./LabelableContext.js";

/**
 * @internal
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const LabelableProvider = function LabelableProvider(props) {
  const defaultId = useBaseUiId();
  const [controlId, setControlId] = React.useState(props.initialControlId === undefined ? defaultId : props.initialControlId);
  const [labelId, setLabelId] = React.useState(undefined);
  const [messageIds, setMessageIds] = React.useState([]);
  const {
    messageIds: parentMessageIds
  } = useLabelableContext();
  const getDescriptionProps = React.useCallback(externalProps => {
    return mergeProps({
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
  return /*#__PURE__*/_jsx(LabelableContext.Provider, {
    value: contextValue,
    children: props.children
  });
};
if (process.env.NODE_ENV !== "production") LabelableProvider.displayName = "LabelableProvider";