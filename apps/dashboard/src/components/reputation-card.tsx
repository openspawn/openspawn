import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

interface ReputationSummary {
  trustScore: number;
  reputationLevel: string;
  tasksCompleted: number;
  tasksSuccessful: number;
  successRate: number;
  lastActivityAt: string | null;
  promotionProgress: {
    currentLevel: number;
    nextLevel: number | null;
    trustScoreRequired: number | null;
    tasksRequired: number | null;
    trustScoreProgress: number;
    tasksProgress: number;
  } | null;
}

interface ReputationCardProps {
  reputation: ReputationSummary;
}

const LEVEL_COLORS: Record<string, string> = {
  NEW: "bg-gray-500",
  PROBATION: "bg-orange-500",
  TRUSTED: "bg-cyan-500",
  VETERAN: "bg-violet-500",
  ELITE: "bg-amber-500",
};

const LEVEL_EMOJI: Record<string, string> = {
  NEW: "🆕",
  PROBATION: "⚠️",
  TRUSTED: "✅",
  VETERAN: "🏆",
  ELITE: "👑",
};

export function ReputationCard({ reputation }: ReputationCardProps) {
  const levelColor = LEVEL_COLORS[reputation.reputationLevel] || "bg-gray-500";
  const levelEmoji = LEVEL_EMOJI[reputation.reputationLevel] || "❓";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Trust & Reputation</span>
          <Badge className={levelColor}>
            {levelEmoji} {reputation.reputationLevel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trust Score */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Trust Score</span>
            <span className="font-semibold">{reputation.trustScore}/100</span>
          </div>
          <Progress value={reputation.trustScore} className="h-2" />
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{reputation.tasksCompleted}</div>
            <div className="text-xs text-muted-foreground">Tasks Done</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reputation.tasksSuccessful}</div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reputation.successRate}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Promotion Progress */}
        {reputation.promotionProgress && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">
              Progress to Level {reputation.promotionProgress.nextLevel}
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Trust Score</span>
                  <span>
                    {reputation.trustScore} / {reputation.promotionProgress.trustScoreRequired}
                  </span>
                </div>
                <Progress
                  value={reputation.promotionProgress.trustScoreProgress}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tasks Completed</span>
                  <span>
                    {reputation.tasksCompleted} / {reputation.promotionProgress.tasksRequired}
                  </span>
                </div>
                <Progress
                  value={reputation.promotionProgress.tasksProgress}
                  className="h-1.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Last Activity */}
        {reputation.lastActivityAt && (
          <div className="text-xs text-muted-foreground text-right">
            Last active: {new Date(reputation.lastActivityAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
