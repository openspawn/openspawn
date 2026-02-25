import * as React from 'react';
import type { BaseUIComponentProps } from "../../utils/types.js";
import type { Side, Align } from "../../utils/useAnchorPositioning.js";
import type { TransitionStatus } from "../../utils/useTransitionStatus.js";
/**
 * A container for the select list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectPopup: React.ForwardRefExoticComponent<Omit<SelectPopupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectPopupProps extends BaseUIComponentProps<'div', SelectPopup.State> {
  children?: React.ReactNode;
}
export interface SelectPopupState {
  side: Side | 'none';
  align: Align;
  open: boolean;
  transitionStatus: TransitionStatus;
}
export declare namespace SelectPopup {
  type Props = SelectPopupProps;
  type State = SelectPopupState;
}