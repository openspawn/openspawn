import * as React from 'react';
import type { Orientation } from "../utils/types.js";
import type { BaseUIChangeEventDetails } from "../utils/createBaseUIEventDetails.js";
import type { BaseUIEventReasons } from "../utils/reasons.js";
export interface ToggleGroupContext {
  value: readonly any[];
  setGroupValue: (newValue: string, nextPressed: boolean, eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  disabled: boolean;
  orientation: Orientation;
}
export declare const ToggleGroupContext: React.Context<ToggleGroupContext | undefined>;
export declare function useToggleGroupContext(optional?: boolean): ToggleGroupContext | undefined;