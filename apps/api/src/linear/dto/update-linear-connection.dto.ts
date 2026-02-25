export class UpdateLinearConnectionDto {
  name?: string;
  apiKey?: string;
  teamFilter?: string[];
  enabled?: boolean;
  createTaskOnIssue?: boolean;
  createTaskOnComment?: boolean;
  closeIssueOnComplete?: boolean;
  commentOnStatusChange?: boolean;
  syncAssignee?: boolean;
}
