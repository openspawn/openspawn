import type { ReferenceType } from "../types.js";
import type { BaseUIChangeEventDetails } from "../../utils/createBaseUIEventDetails.js";
import { FloatingRootStore } from "../components/FloatingRootStore.js";
import { PopupTriggerMap } from "../../utils/popups/index.js";
export interface UseFloatingRootContextOptions {
  open?: boolean;
  onOpenChange?(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  elements?: {
    reference?: ReferenceType | null;
    floating?: HTMLElement | null;
    triggers?: PopupTriggerMap;
  };
  /**
   * Whether to prevent the auto-emitted `openchange` event.
   */
  noEmit?: boolean;
}
export declare function useFloatingRootContext(options: UseFloatingRootContextOptions): FloatingRootStore;