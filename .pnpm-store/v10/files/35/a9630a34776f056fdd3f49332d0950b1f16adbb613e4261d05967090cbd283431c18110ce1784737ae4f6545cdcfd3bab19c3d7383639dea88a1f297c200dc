import * as React from 'react';
import { Store } from "./Store.js";
export interface StoreInspectorProps {
  /**
   * Instance of the store to inspect.
   */
  store: Store<any>;
  /**
   * Additional data to display in the inspector.
   */
  additionalData?: any;
  /**
   * Title to display in the panel header.
   */
  title?: string;
  /**
   * Whether the inspector panel should be open by default.
   * @default false
   */
  defaultOpen?: boolean;
}
/**
 * A tool to inspect the state of a Store in a floating panel.
 * This is intended for development and debugging purposes.
 */
export declare function StoreInspector(props: StoreInspectorProps): import("react/jsx-runtime").JSX.Element;
interface PanelProps {
  store: Store<any>;
  title?: string;
  additionalData?: any;
  open: boolean;
  onClose?: () => void;
}
export declare function StoreInspectorPanel({
  store,
  title,
  additionalData,
  open,
  onClose
}: PanelProps): React.ReactPortal | null;
export {};