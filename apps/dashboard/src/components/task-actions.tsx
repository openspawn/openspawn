import { MoreHorizontal, Play, CheckCircle2, Pause, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTransitionTask, useApproveTask } from "@openspawn/dashboard-data";
import { TaskStatus } from "@openspawn/shared-types";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TaskActionsProps {
  taskId: string;
  taskStatus: string;
  taskTitle: string;
  approvalRequired?: boolean;
}

function TaskActions({ taskId, taskStatus, taskTitle, approvalRequired }: TaskActionsProps) {
  const transition = useTransitionTask(taskId);
  const approve = useApproveTask(taskId);

  const handleTransition = async (status: TaskStatus, label: string) => {
    try {
      await transition.mutateAsync({ status });
      toast.success(`"${taskTitle}" ${label}`);
    } catch {
      toast.error(`Failed to transition task`);
    }
  };

  const handleApprove = async () => {
    try {
      await approve.mutateAsync();
      toast.success(`"${taskTitle}" approved`);
    } catch {
      toast.error("Failed to approve task");
    }
  };

  const canStart = taskStatus === TaskStatus.TODO || taskStatus === TaskStatus.BACKLOG;
  const canSubmitForReview = taskStatus === TaskStatus.IN_PROGRESS;
  const canComplete = taskStatus === TaskStatus.REVIEW;
  const canBlock = taskStatus === TaskStatus.IN_PROGRESS;
  const canApprove = taskStatus === TaskStatus.REVIEW && approvalRequired;

  const hasActions = canStart || canSubmitForReview || canComplete || canBlock || canApprove;

  if (!hasActions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canStart && (
          <DropdownMenuItem onClick={() => handleTransition(TaskStatus.IN_PROGRESS, "started")}>
            <Play className="mr-2 h-4 w-4" /> Start
          </DropdownMenuItem>
        )}

        {canSubmitForReview && (
          <DropdownMenuItem
            onClick={() => handleTransition(TaskStatus.REVIEW, "submitted for review")}
          >
            <ArrowRight className="mr-2 h-4 w-4" /> Submit for Review
          </DropdownMenuItem>
        )}

        {canComplete && (
          <DropdownMenuItem onClick={() => handleTransition(TaskStatus.DONE, "completed")}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
          </DropdownMenuItem>
        )}

        {canApprove && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleApprove}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approve
            </DropdownMenuItem>
          </>
        )}

        {canBlock && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleTransition(TaskStatus.BLOCKED, "blocked")}
            >
              <Pause className="mr-2 h-4 w-4" /> Block
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { TaskActions };
