import * as React from 'react';
import type { BaseUIComponentProps } from "../../utils/types.js";
/**
 * A link in the navigation menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuLink: React.ForwardRefExoticComponent<Omit<NavigationMenuLinkProps, "ref"> & React.RefAttributes<HTMLAnchorElement>>;
export interface NavigationMenuLinkState {
  /**
   * Whether the link is the currently active page.
   */
  active: boolean;
}
export interface NavigationMenuLinkProps extends BaseUIComponentProps<'a', NavigationMenuLink.State> {
  /**
   * Whether the link is the currently active page.
   * @default false
   */
  active?: boolean;
  /**
   * Whether to close the navigation menu when the link is clicked.
   * @default false
   */
  closeOnClick?: boolean;
}
export declare namespace NavigationMenuLink {
  type State = NavigationMenuLinkState;
  type Props = NavigationMenuLinkProps;
}