import type { ElementProps, FloatingContext, FloatingRootContext } from "../types.js";
type AriaRole = 'tooltip' | 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'grid' | 'tree';
type ComponentRole = 'select' | 'label' | 'combobox';
export interface UseRoleProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * The role of the floating element.
   * @default 'dialog'
   */
  role?: AriaRole | ComponentRole;
}
/**
 * Adds base screen reader props to the reference and floating elements for a
 * given floating element `role`.
 * @see https://floating-ui.com/docs/useRole
 */
export declare function useRole(context: FloatingRootContext | FloatingContext, props?: UseRoleProps): ElementProps;
export {};