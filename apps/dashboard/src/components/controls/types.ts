import type { NodeStatus } from "../live/replay-data";

export type AgentControlStatus = NodeStatus | "paused";

export interface AgentControlState {
  id: string;
  name: string;
  emoji: string;
  avatarUrl?: string;
  status: AgentControlStatus;
  department: string;
  modelTier: "sonnet" | "opus";
}

export const DEPARTMENTS = [
  "Kitchen Ops",
  "Delivery",
  "Finance",
  "Operations",
  "Quality Control",
  "Customer Service",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// Map agents to departments based on org chart
export const AGENT_DEPARTMENTS: Record<string, Department> = {
  "mr-krabs": "Operations",
  "spongebob-squarepants": "Kitchen Ops",
  "squidward-tentacles": "Delivery",
  "squilliam-fancyson": "Finance",
  "sandy-cheeks": "Kitchen Ops",
  karen: "Kitchen Ops",
  "pearl-krabs": "Delivery",
  "perch-perkins": "Delivery",
  "barnacle-boy": "Delivery",
  plankton: "Finance",
  "mrs-puff": "Finance",
  "patrick-star": "Kitchen Ops",
  gary: "Kitchen Ops",
  "plankton-jr": "Kitchen Ops",
  "mermaid-man": "Kitchen Ops",
  "larry-the-lobster": "Delivery",
  "bubble-bass": "Delivery",
  dennis: "Delivery",
  "flying-dutchman": "Delivery",
  "fred-1": "Delivery",
  "fred-2": "Delivery",
  "fred-3": "Delivery",
};
