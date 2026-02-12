import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AgentAvatar } from "./agent-avatar";

interface LeaderboardEntry {
  id: string;
  agentId: string;
  name: string;
  level: number;
  trustScore: number;
  reputationLevel: string;
  tasksCompleted: number;
}

interface TrustLeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  onAgentClick?: (id: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  NEW: "bg-gray-500",
  PROBATION: "bg-orange-500",
  TRUSTED: "bg-cyan-500",
  VETERAN: "bg-violet-500",
  ELITE: "bg-amber-500",
};

const RANK_EMOJI = ["🥇", "🥈", "🥉"];

export function TrustLeaderboard({
  entries,
  title = "Trust Leaderboard",
  onAgentClick,
}: TrustLeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏆</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => onAgentClick?.(entry.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 text-center text-lg">
                  {index < 3 ? RANK_EMOJI[index] : `#${index + 1}`}
                </div>
                <AgentAvatar
                  agentId={entry.agentId}
                  name={entry.name}
                  level={entry.level}
                  size="sm"
                  showRing={false}
                  avatar={(entry as any).avatar}
                  avatarColor={(entry as any).avatarColor}
                />
                <div>
                  <div className="font-medium">{entry.name}</div>
                  <div className="text-xs text-muted-foreground">
                    L{entry.level} · {entry.tasksCompleted} tasks
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-semibold">{entry.trustScore}</div>
                  <div className="text-xs text-muted-foreground">trust</div>
                </div>
                <Badge
                  className={`${LEVEL_COLORS[entry.reputationLevel] || "bg-gray-500"} text-xs`}
                >
                  {entry.reputationLevel}
                </Badge>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No agents yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
