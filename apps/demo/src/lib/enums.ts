/** Shared enums used across multiple demo pages. */

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}

export enum AgentSortField {
  Name = "name",
  Level = "level",
  Balance = "balance",
  Status = "status",
  Created = "created",
}

export enum TaskSortField {
  Title = "title",
  Priority = "priority",
  Status = "status",
  Created = "created",
}

export enum DialogModeValue {
  View = "view",
  Edit = "edit",
  Credits = "credits",
}

export type DialogMode = DialogModeValue | null;
