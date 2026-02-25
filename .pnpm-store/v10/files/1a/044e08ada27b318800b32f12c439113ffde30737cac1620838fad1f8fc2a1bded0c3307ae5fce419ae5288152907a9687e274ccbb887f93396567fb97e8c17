'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from "../../utils/useBaseUiId.js";
import { useRenderElement } from "../../utils/useRenderElement.js";
import { useCompositeListItem } from "../../composite/list/useCompositeListItem.js";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping.js";
import { useTabsRootContext } from "../root/TabsRootContext.js";
import { TabsPanelDataAttributes } from "./TabsPanelDataAttributes.js";

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsPanel = /*#__PURE__*/React.forwardRef(function TabPanel(componentProps, forwardedRef) {
  const {
    className,
    value,
    render,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const {
    value: selectedValue,
    getTabIdByPanelValue,
    orientation,
    tabActivationDirection,
    registerMountedTabPanel,
    unregisterMountedTabPanel
  } = useTabsRootContext();
  const id = useBaseUiId();
  const metadata = React.useMemo(() => ({
    id,
    value
  }), [id, value]);
  const {
    ref: listItemRef,
    index
  } = useCompositeListItem({
    metadata
  });
  const hidden = value !== selectedValue;
  const correspondingTabId = getTabIdByPanelValue(value);
  const state = React.useMemo(() => ({
    hidden,
    orientation,
    tabActivationDirection
  }), [hidden, orientation, tabActivationDirection]);
  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef],
    props: [{
      'aria-labelledby': correspondingTabId,
      hidden,
      id: id ?? undefined,
      role: 'tabpanel',
      tabIndex: hidden ? -1 : 0,
      [TabsPanelDataAttributes.index]: index
    }, elementProps],
    stateAttributesMapping: tabsStateAttributesMapping
  });
  useIsoLayoutEffect(() => {
    if (hidden && !keepMounted) {
      return undefined;
    }
    if (id == null) {
      return undefined;
    }
    registerMountedTabPanel(value, id);
    return () => {
      unregisterMountedTabPanel(value, id);
    };
  }, [hidden, keepMounted, value, id, registerMountedTabPanel, unregisterMountedTabPanel]);
  const shouldRender = !hidden || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") TabsPanel.displayName = "TabsPanel";