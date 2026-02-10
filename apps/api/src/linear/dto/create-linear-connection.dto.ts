export class CreateLinearConnectionDto {
  name!: string;
  teamId!: string;
  apiKey?: string;
  teamFilter?: string[];
  createTaskOnIssue?: boolean;
  createTaskOnComment?: boolean;
  closeIssueOnComplete?: boolean;
  commentOnStatusChange?: boolean;
  syncAssignee?: boolean;
}
