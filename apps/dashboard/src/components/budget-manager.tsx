import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "./ui/dialog";

interface BudgetStatus {
  agentId: string;
  agentName: string;
  currentBalance: number;
  budgetPeriodLimit: number | null;
  budgetPeriodSpent: number;
  budgetRemaining: number | null;
  utilizationPercent: number | null;
}

// Mock data
const MOCK_BUDGETS: BudgetStatus[] = [
  {
    agentId: "agent-1",
    agentName: "Research Lead",
    currentBalance: 5000,
    budgetPeriodLimit: 10000,
    budgetPeriodSpent: 8500,
    budgetRemaining: 1500,
    utilizationPercent: 85,
  },
  {
    agentId: "agent-2",
    agentName: "Content Manager",
    currentBalance: 3200,
    budgetPeriodLimit: 5000,
    budgetPeriodSpent: 4800,
    budgetRemaining: 200,
    utilizationPercent: 96,
  },
  {
    agentId: "agent-3",
    agentName: "Data Analyst",
    currentBalance: 1500,
    budgetPeriodLimit: 3000,
    budgetPeriodSpent: 1200,
    budgetRemaining: 1800,
    utilizationPercent: 40,
  },
];

export function BudgetManager() {
  const [budgets] = useState<BudgetStatus[]>(MOCK_BUDGETS);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [targetAgent, setTargetAgent] = useState("");

  const alertBudgets = budgets.filter((b) => (b.utilizationPercent || 0) >= 80);
  const healthyBudgets = budgets.filter((b) => (b.utilizationPercent || 0) < 80);

  const handleTransfer = async () => {
    setTransferring(true);
    // TODO: Implement API call
    await new Promise((r) => setTimeout(r, 1000));
    setTransferring(false);
    setShowTransfer(false);
    setTransferAmount("");
    setTargetAgent("");
  };

  const getUtilizationColor = (percent: number | null) => {
    if (percent === null) return "bg-muted";
    if (percent >= 90) return "bg-red-500";
    if (percent >= 80) return "bg-amber-500";
    if (percent >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {alertBudgets.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-amber-500">Budget Alerts</CardTitle>
            </div>
            <CardDescription>
              {alertBudgets.length} agent{alertBudgets.length !== 1 ? "s" : ""} approaching budget limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertBudgets.map((budget) => (
                <motion.div
                  key={budget.agentId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                >
                  <div>
                    <p className="font-medium">{budget.agentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {budget.budgetRemaining?.toLocaleString()} credits remaining
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={budget.utilizationPercent! >= 90 ? "border-red-500 text-red-500" : "border-amber-500 text-amber-500"}
                    >
                      {budget.utilizationPercent}% used
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAgent(budget.agentId);
                        setShowTransfer(true);
                      }}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Top Up
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Budgets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>Budget Overview</CardTitle>
            </div>
            <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
              <DialogTrigger>
                <Button variant="outline" size="sm">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Transfer Credits
                </Button>
              </DialogTrigger>
              <DialogPopup>
                <DialogHeader>
                  <DialogTitle>Transfer Credits</DialogTitle>
                  <DialogDescription>
                    Move credits between agents in your hierarchy
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Agent</label>
                    <select
                      value={selectedAgent || ""}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select agent...</option>
                      {budgets.map((b) => (
                        <option key={b.agentId} value={b.agentId}>
                          {b.agentName} ({b.currentBalance.toLocaleString()} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Agent</label>
                    <select
                      value={targetAgent}
                      onChange={(e) => setTargetAgent(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select agent...</option>
                      {budgets
                        .filter((b) => b.agentId !== selectedAgent)
                        .map((b) => (
                          <option key={b.agentId} value={b.agentId}>
                            {b.agentName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Enter amount..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTransfer(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTransfer}
                    disabled={!selectedAgent || !targetAgent || !transferAmount || transferring}
                  >
                    {transferring ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Transfer
                  </Button>
                </DialogFooter>
              </DialogPopup>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.agentId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{budget.agentName}</span>
                    {budget.utilizationPercent !== null && (
                      <Badge
                        variant="outline"
                        className={
                          budget.utilizationPercent >= 80
                            ? "border-amber-500 text-amber-500"
                            : ""
                        }
                      >
                        {budget.utilizationPercent}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      {budget.currentBalance.toLocaleString()}
                    </span>
                    {budget.budgetPeriodLimit && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TrendingDown className="h-3 w-3" />
                        {budget.budgetPeriodSpent.toLocaleString()}/{budget.budgetPeriodLimit.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {budget.budgetPeriodLimit && (
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <motion.div
                      className={`h-2 rounded-full ${getUtilizationColor(budget.utilizationPercent)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${budget.utilizationPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
