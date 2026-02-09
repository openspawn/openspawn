import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ClipboardList, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { useSelfClaim, type ClaimResult } from "../hooks";
import confetti from "canvas-confetti";

interface Props { agentId: string; agentName: string; size?: "sm" | "md" | "lg"; showCount?: boolean; onClaimSuccess?: (r: ClaimResult) => void; }

export function SelfClaimButton({ agentId, size = "md", showCount = true, onClaimSuccess }: Props) {
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<ClaimResult | null>(null);
  const { claimableCount, isLoadingCount, claimNextTask, isClaiming } = useSelfClaim({
    agentId,
    onSuccess: r => { setLastResult(r); setShowResult(true); if (r.success) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#22c55e", "#10b981"] }); onClaimSuccess?.(r); setTimeout(() => setShowResult(false), 3000); },
  });

  const sizes = { sm: "h-8 text-xs px-3", md: "h-10 text-sm px-4", lg: "h-12 text-base px-6" };
  const icons = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  const has = claimableCount > 0;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {showResult && lastResult ? (
          <motion.div key="r" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <Card className={`overflow-hidden ${lastResult.success ? "border-emerald-500/50 bg-emerald-500/10" : "border-amber-500/50 bg-amber-500/10"}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <CheckCircle2 className={`h-8 w-8 ${lastResult.success ? "text-emerald-500" : "text-amber-500"}`} />
                <div><p className="font-medium text-sm">{lastResult.success ? "Task Claimed! 🎉" : lastResult.message}</p>{lastResult.task && <Badge variant="outline" className="text-xs mt-1">{lastResult.task.identifier}</Badge>}</div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Button onClick={() => claimNextTask()} disabled={isClaiming || !has} className={`${sizes[size]} ${has ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg" : ""}`}>
            <span className="flex items-center gap-2">
              {isClaiming ? <><Loader2 className={`${icons[size]} animate-spin`} /> Claiming...</> : has ? <><Zap className={icons[size]} /> Claim Task {showCount && <Badge variant="secondary" className="ml-1 bg-white/20 text-white border-0">{isLoadingCount ? "..." : claimableCount}</Badge>}</> : <><ClipboardList className={icons[size]} /> No Tasks</>}
            </span>
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SelfClaimHero({ agentId, agentName, onClaimSuccess }: { agentId: string; agentName: string; onClaimSuccess?: (r: ClaimResult) => void }) {
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<ClaimResult | null>(null);
  const { claimableCount, claimNextTask, isClaiming } = useSelfClaim({
    agentId,
    onSuccess: r => { setLastResult(r); setShowResult(true); if (r.success) { const end = Date.now() + 2000; (function f() { confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ["#22c55e"] }); confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ["#22c55e"] }); if (Date.now() < end) requestAnimationFrame(f); })(); } onClaimSuccess?.(r); setTimeout(() => setShowResult(false), 4000); },
  });
  const has = claimableCount > 0;

  return (
    <Card className="overflow-hidden border-2 border-dashed hover:border-emerald-500/50 transition-colors">
      <CardContent className="p-6 text-center">
        <AnimatePresence mode="wait">
          {showResult && lastResult?.success && lastResult.task ? (
            <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-emerald-500 mb-2">Task Claimed! 🎉</h3>
              <Badge variant="outline">{lastResult.task.identifier}</Badge>
              <span className="ml-2 text-sm">{lastResult.task.title}</span>
            </motion.div>
          ) : (
            <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-muted-foreground mb-4">{has ? `${claimableCount} task${claimableCount !== 1 ? "s" : ""} available` : "No tasks available"}</p>
              <Button size="lg" onClick={() => claimNextTask()} disabled={isClaiming || !has} className={`w-full max-w-md h-14 text-lg ${has ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl" : ""}`}>
                {isClaiming ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Finding task...</> : has ? <><Zap className="h-5 w-5 mr-2" /> Claim Next Task <Badge className="ml-2 bg-white/20 text-white border-0">{claimableCount}</Badge></> : <><ClipboardList className="h-5 w-5 mr-2" /> No Tasks</>}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
