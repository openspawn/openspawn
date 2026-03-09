/** Shared enums used across multiple dashboard pages. */

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}

export enum DialogModeValue {
  View = "view",
  Edit = "edit",
  Credits = "credits",
}

export type DialogMode = DialogModeValue | null;
