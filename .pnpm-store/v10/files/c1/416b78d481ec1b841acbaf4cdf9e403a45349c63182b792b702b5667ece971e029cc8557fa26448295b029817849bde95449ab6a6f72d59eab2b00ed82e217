"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabsPanel = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useBaseUiId = require("../../utils/useBaseUiId");
var _useRenderElement = require("../../utils/useRenderElement");
var _useCompositeListItem = require("../../composite/list/useCompositeListItem");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
var _TabsRootContext = require("../root/TabsRootContext");
var _TabsPanelDataAttributes = require("./TabsPanelDataAttributes");
/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
const TabsPanel = exports.TabsPanel = /*#__PURE__*/React.forwardRef(function TabPanel(componentProps, forwardedRef) {
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
  } = (0, _TabsRootContext.useTabsRootContext)();
  const id = (0, _useBaseUiId.useBaseUiId)();
  const metadata = React.useMemo(() => ({
    id,
    value
  }), [id, value]);
  const {
    ref: listItemRef,
    index
  } = (0, _useCompositeListItem.useCompositeListItem)({
    metadata
  });
  const hidden = value !== selectedValue;
  const correspondingTabId = getTabIdByPanelValue(value);
  const state = React.useMemo(() => ({
    hidden,
    orientation,
    tabActivationDirection
  }), [hidden, orientation, tabActivationDirection]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef],
    props: [{
      'aria-labelledby': correspondingTabId,
      hidden,
      id: id ?? undefined,
      role: 'tabpanel',
      tabIndex: hidden ? -1 : 0,
      [_TabsPanelDataAttributes.TabsPanelDataAttributes.index]: index
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.tabsStateAttributesMapping
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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