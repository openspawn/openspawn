import * as React from 'react';
import type { BaseUIComponentProps } from "../../utils/types.js";
import { TooltipHandle } from "../store/TooltipHandle.js";
/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export declare const TooltipTrigger: TooltipTrigger;
export interface TooltipTrigger {
  <Payload>(componentProps: TooltipTrigger.Props<Payload> & React.RefAttributes<HTMLElement>): React.JSX.Element;
}
export interface TooltipTriggerState {
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
}
export interface TooltipTriggerProps<Payload = unknown> extends BaseUIComponentProps<'button', TooltipTrigger.State> {
  /**
   * A handle to associate the trigger with a tooltip.
   */
  handle?: TooltipHandle<Payload>;
  /**
   * A payload to pass to the tooltip when it is opened.
   */
  payload?: Payload;
  /**
   * How long to wait before opening the tooltip. Specified in milliseconds.
   * @default 600
   */
  delay?: number;
  /**
   * How long to wait before closing the tooltip. Specified in milliseconds.
   * @default 0
   */
  closeDelay?: number;
}
export declare namespace TooltipTrigger {
  type State = TooltipTriggerState;
  type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}