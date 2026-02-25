import * as React from 'react';
import type { BaseUIComponentProps } from "../../utils/types.js";
import type { TransitionStatus } from "../../utils/useTransitionStatus.js";
/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuPopup: React.ForwardRefExoticComponent<Omit<NavigationMenuPopupProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface NavigationMenuPopupState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
  /**
   * The transition status of the popup.
   */
  transitionStatus: TransitionStatus;
}
export interface NavigationMenuPopupProps extends BaseUIComponentProps<'nav', NavigationMenuPopup.State> {}
export declare namespace NavigationMenuPopup {
  type State = NavigationMenuPopupState;
  type Props = NavigationMenuPopupProps;
}