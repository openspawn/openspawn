import * as React from 'react';
import { BaseUIComponentProps, NonNativeButtonProps } from "../../utils/types.js";
/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuSubmenuTrigger: React.ForwardRefExoticComponent<Omit<MenuSubmenuTriggerProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface MenuSubmenuTriggerProps extends NonNativeButtonProps, BaseUIComponentProps<'div', MenuSubmenuTrigger.State> {
  onClick?: React.MouseEventHandler<HTMLElement>;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string;
  /**
   * @ignore
   */
  id?: string;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * How long to wait before the menu may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 100
   */
  delay?: number;
  /**
   * How long to wait before closing the menu that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay?: number;
  /**
   * Whether the menu should also open when the trigger is hovered.
   */
  openOnHover?: boolean;
}
export interface MenuSubmenuTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
}
export declare namespace MenuSubmenuTrigger {
  type Props = MenuSubmenuTriggerProps;
  type State = MenuSubmenuTriggerState;
}