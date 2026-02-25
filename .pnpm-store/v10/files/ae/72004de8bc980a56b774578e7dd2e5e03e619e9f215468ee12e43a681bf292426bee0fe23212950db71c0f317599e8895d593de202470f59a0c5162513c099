import { createSelector } from '@base-ui/utils/store';
import { getEmptyRootContext } from "../../floating-ui-react/utils/getEmptyRootContext.js";
import { EMPTY_OBJECT } from "../constants.js";

/**
 * State common to all popup stores.
 */

export function createInitialPopupStoreState() {
  return {
    open: false,
    mounted: false,
    transitionStatus: 'idle',
    floatingRootContext: getEmptyRootContext(),
    preventUnmountingOnClose: false,
    payload: undefined,
    activeTriggerId: null,
    activeTriggerElement: null,
    popupElement: null,
    positionerElement: null,
    activeTriggerProps: EMPTY_OBJECT,
    inactiveTriggerProps: EMPTY_OBJECT,
    popupProps: EMPTY_OBJECT
  };
}
export const popupStoreSelectors = {
  open: createSelector(state => state.open),
  mounted: createSelector(state => state.mounted),
  transitionStatus: createSelector(state => state.transitionStatus),
  floatingRootContext: createSelector(state => state.floatingRootContext),
  preventUnmountingOnClose: createSelector(state => state.preventUnmountingOnClose),
  payload: createSelector(state => state.payload),
  activeTriggerId: createSelector(state => state.activeTriggerId),
  activeTriggerElement: createSelector(state => state.mounted ? state.activeTriggerElement : null),
  /**
   * Whether the trigger with the given ID was used to open the popup.
   */
  isTriggerActive: createSelector((state, triggerId) => triggerId !== undefined && state.activeTriggerId === triggerId),
  /**
   * Whether the popup is open and was activated by a trigger with the given ID.
   */
  isOpenedByTrigger: createSelector((state, triggerId) => triggerId !== undefined && state.activeTriggerId === triggerId && state.open),
  /**
   * Whether the popup is mounted and was activated by a trigger with the given ID.
   */
  isMountedByTrigger: createSelector((state, triggerId) => triggerId !== undefined && state.activeTriggerId === triggerId && state.mounted),
  triggerProps: createSelector((state, isActive) => isActive ? state.activeTriggerProps : state.inactiveTriggerProps),
  popupProps: createSelector(state => state.popupProps),
  popupElement: createSelector(state => state.popupElement),
  positionerElement: createSelector(state => state.positionerElement)
};