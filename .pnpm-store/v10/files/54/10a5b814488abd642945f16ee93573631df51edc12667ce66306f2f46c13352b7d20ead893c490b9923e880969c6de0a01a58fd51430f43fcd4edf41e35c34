"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxChipRemove = void 0;
var React = _interopRequireWildcard(require("react"));
var _store = require("@base-ui/utils/store");
var _useRenderElement = require("../../utils/useRenderElement");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _ComboboxChipContext = require("../chip/ComboboxChipContext");
var _useButton = require("../../use-button");
var _utils = require("../../floating-ui-react/utils");
var _store2 = require("../store");
var _createBaseUIEventDetails = require("../../utils/createBaseUIEventDetails");
var _reasons = require("../../utils/reasons");
var _itemEquality = require("../../utils/itemEquality");
/**
 * A button to remove a chip.
 * Renders a `<button>` element.
 */
const ComboboxChipRemove = exports.ComboboxChipRemove = /*#__PURE__*/React.forwardRef(function ComboboxChipRemove(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const {
    index
  } = (0, _ComboboxChipContext.useComboboxChipContext)();
  const comboboxDisabled = (0, _store.useStore)(store, _store2.selectors.disabled);
  const readOnly = (0, _store.useStore)(store, _store2.selectors.readOnly);
  const selectedValue = (0, _store.useStore)(store, _store2.selectors.selectedValue);
  const isItemEqualToValue = (0, _store.useStore)(store, _store2.selectors.isItemEqualToValue);
  const disabled = comboboxDisabled || disabledProp;
  const {
    buttonRef,
    getButtonProps
  } = (0, _useButton.useButton)({
    native: nativeButton,
    disabled: disabled || readOnly,
    focusableWhenDisabled: true
  });
  const state = React.useMemo(() => ({
    disabled
  }), [disabled]);
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [{
      tabIndex: -1,
      'aria-readonly': readOnly || undefined,
      onClick(event) {
        if (disabled || readOnly) {
          return;
        }
        const eventDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.chipRemovePress, event.nativeEvent);

        // If the removed chip was the active item, clear highlight
        const activeIndex = store.state.activeIndex;
        const removedItem = selectedValue[index];

        // Try current visible list first; if not found, it's filtered out. No need
        // to clear highlight in that case since it can't equal activeIndex.
        const removedIndex = (0, _itemEquality.findItemIndex)(store.state.valuesRef.current, removedItem, isItemEqualToValue);
        if (removedIndex !== -1 && activeIndex === removedIndex) {
          store.state.setIndices({
            activeIndex: null,
            type: store.state.keyboardActiveRef.current ? 'pointer' : 'keyboard'
          });
        }
        store.state.setSelectedValue(selectedValue.filter((_, i) => i !== index), eventDetails);
        if (!eventDetails.isPropagationAllowed) {
          event.stopPropagation();
        }
        store.state.inputRef.current?.focus();
      },
      onKeyDown(event) {
        if (disabled || readOnly) {
          return;
        }
        const eventDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.chipRemovePress, event.nativeEvent);
        if (event.key === 'Enter' || event.key === ' ') {
          // If the removed chip was the active item, clear highlight
          const activeIndex = store.state.activeIndex;
          const removedItem = selectedValue[index];
          const removedIndex = (0, _itemEquality.findItemIndex)(store.state.valuesRef.current, removedItem, isItemEqualToValue);
          if (removedIndex !== -1 && activeIndex === removedIndex) {
            store.state.setIndices({
              activeIndex: null,
              type: store.state.keyboardActiveRef.current ? 'pointer' : 'keyboard'
            });
          }
          store.state.setSelectedValue(selectedValue.filter((_, i) => i !== index), eventDetails);
          if (!eventDetails.isPropagationAllowed) {
            (0, _utils.stopEvent)(event);
          }
          store.state.inputRef.current?.focus();
        }
      }
    }, elementProps, getButtonProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ComboboxChipRemove.displayName = "ComboboxChipRemove";