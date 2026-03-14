import { MoreHorizontal, Play, Ban, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useActivateAgent, useRevokeAgent } from "@openspawn/dashboard-data";
import { AgentStatus } from "@openspawn/shared-types";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useSidePanel } from "../contexts";
import { AgentDetailPanel } from "./agent-detail-panel";

interface AgentActionsProps {
  agentId: string;
  agentStatus: string;
  agentName: string;
}

export function AgentActions({ agentId, agentStatus, agentName }: AgentActionsProps) {
  const { openSidePanel, closeSidePanel } = useSidePanel();
  const activate = useActivateAgent(agentId);
  const revoke = useRevokeAgent(agentId);

  const handleViewDetails = () => {
    openSidePanel(<AgentDetailPanel agentId={agentId} onClose={closeSidePanel} />, { width: 520 });
  };

  const handleActivate = async () => {
    try {
      await activate.mutateAsync();
      toast.success(`${agentName} activated`);
    } catch {
      toast.error("Failed to activate agent");
    }
  };

  const handleRevoke = async () => {
    try {
      await revoke.mutateAsync();
      toast.success(`${agentName} revoked`);
    } catch {
      toast.error("Failed to revoke agent");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewDetails}>
          <ExternalLink className="mr-2 h-4 w-4" /> View Details
        </DropdownMenuItem>

        {agentStatus === AgentStatus.PENDING && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleActivate}>
              <Play className="mr-2 h-4 w-4" /> Activate
            </DropdownMenuItem>
          </>
        )}

        {agentStatus === AgentStatus.ACTIVE && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleRevoke}>
              <Ban className="mr-2 h-4 w-4" /> Revoke
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
