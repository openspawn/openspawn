import type { Node, Edge } from "@xyflow/react";
import type { DemoAgent } from "@openspawn/demo-data";

interface AgentNodeData {
  label: string;
  role: string;
  level: number;
  status: "active" | "pending" | "paused" | "suspended";
  credits: number;
  isHuman?: boolean;
  domain?: string;
  tasksCompleted?: number;
  agentId?: string;
}

// Calculate node position based on hierarchy
function calculatePositions(agents: DemoAgent[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Group agents by level
  const byLevel = new Map<number, DemoAgent[]>();
  agents.forEach(agent => {
    const level = agent.level;
    if (!byLevel.has(level)) {
      byLevel.set(level, []);
    }
    byLevel.get(level)!.push(agent);
  });
  
  // Position by level (y) and index within level (x)
  const levels = Array.from(byLevel.keys()).sort((a, b) => b - a); // Highest first
  const ySpacing = 140;
  const xSpacing = 160;
  
  let y = 120; // Start after human node
  
  levels.forEach(level => {
    const agentsAtLevel = byLevel.get(level)!;
    const totalWidth = (agentsAtLevel.length - 1) * xSpacing;
    const startX = 400 - totalWidth / 2;
    
    agentsAtLevel.forEach((agent, index) => {
      positions.set(agent.id, {
        x: startX + index * xSpacing,
        y,
      });
    });
    
    y += ySpacing;
  });
  
  return positions;
}

export function transformAgentsToGraph(agents: DemoAgent[]): { nodes: Node<AgentNodeData>[]; edges: Edge[] } {
  const positions = calculatePositions(agents);
  
  // Add human node at the top
  const nodes: Node<AgentNodeData>[] = [
    {
      id: "human",
      type: "agent",
      position: { x: 400, y: 0 },
      data: { 
        label: "Adam", 
        role: "ceo", 
        level: 10, 
        status: "active", 
        credits: 0, 
        isHuman: true 
      },
    },
  ];
  
  // Transform agents to nodes
  agents.forEach(agent => {
    const pos = positions.get(agent.id) || { x: 400, y: 200 };
    
    nodes.push({
      id: agent.id,
      type: "agent",
      position: pos,
      data: {
        label: agent.name,
        role: agent.role,
        level: agent.level,
        status: agent.status as AgentNodeData["status"],
        credits: agent.currentBalance,
        domain: agent.domain,
        tasksCompleted: Math.floor(agent.lifetimeEarnings / 50), // Estimate tasks from earnings
        agentId: agent.agentId,
      },
    });
  });
  
  // Create edges based on parent relationships
  const edges: Edge[] = [];
  
  // Find the COO (level 10 agent)
  const coo = agents.find(a => a.level === 10);
  if (coo) {
    edges.push({
      id: `e-human-${coo.id}`,
      source: "human",
      target: coo.id,
      animated: true,
    });
  }
  
  // Add edges for parent-child relationships
  agents.forEach(agent => {
    if (agent.parentId) {
      edges.push({
        id: `e-${agent.parentId}-${agent.id}`,
        source: agent.parentId,
        target: agent.id,
        data: agent.level >= 7 ? { creditFlow: 50 + Math.random() * 50 } : undefined,
      });
    }
  });
  
  return { nodes, edges };
}

// Hardcoded demo data for when not in demo mode
export function generateStaticDemoData(): { nodes: Node<AgentNodeData>[]; edges: Edge[] } {
  const nodes: Node<AgentNodeData>[] = [
    {
      id: "human",
      type: "agent",
      position: { x: 400, y: 0 },
      data: { label: "Adam", role: "ceo", level: 10, status: "active", credits: 0, isHuman: true },
    },
    {
      id: "coo",
      type: "agent",
      position: { x: 400, y: 120 },
      data: { label: "Agent Dennis", role: "coo", level: 10, status: "active", credits: 50000, tasksCompleted: 142 },
    },
    {
      id: "tech-ta",
      type: "agent",
      position: { x: 100, y: 260 },
      data: { label: "Tech Talent", role: "hr", level: 9, status: "active", credits: 15000, domain: "Engineering", tasksCompleted: 89 },
    },
    {
      id: "finance-ta",
      type: "agent",
      position: { x: 300, y: 260 },
      data: { label: "Finance Talent", role: "hr", level: 9, status: "active", credits: 12000, domain: "Finance", tasksCompleted: 67 },
    },
    {
      id: "marketing-ta",
      type: "agent",
      position: { x: 500, y: 260 },
      data: { label: "Marketing Talent", role: "hr", level: 9, status: "active", credits: 11000, domain: "Marketing", tasksCompleted: 54 },
    },
    {
      id: "sales-ta",
      type: "agent",
      position: { x: 700, y: 260 },
      data: { label: "Sales Talent", role: "hr", level: 9, status: "pending", credits: 8000, domain: "Sales", tasksCompleted: 23 },
    },
    {
      id: "dev-1",
      type: "agent",
      position: { x: 0, y: 400 },
      data: { label: "Code Reviewer", role: "senior", level: 6, status: "active", credits: 3200, tasksCompleted: 156 },
    },
    {
      id: "dev-2",
      type: "agent",
      position: { x: 150, y: 400 },
      data: { label: "Bug Hunter", role: "worker", level: 4, status: "active", credits: 1800, tasksCompleted: 89 },
    },
    {
      id: "dev-3",
      type: "agent",
      position: { x: 50, y: 520 },
      data: { label: "New Intern", role: "worker", level: 1, status: "pending", credits: 100, tasksCompleted: 3 },
    },
    {
      id: "fin-1",
      type: "agent",
      position: { x: 280, y: 400 },
      data: { label: "Analyst", role: "senior", level: 5, status: "active", credits: 2400, tasksCompleted: 78 },
    },
    {
      id: "fin-2",
      type: "agent",
      position: { x: 360, y: 400 },
      data: { label: "Bookkeeper", role: "worker", level: 3, status: "paused", credits: 900, tasksCompleted: 34 },
    },
    {
      id: "mkt-1",
      type: "agent",
      position: { x: 480, y: 400 },
      data: { label: "Copywriter", role: "senior", level: 6, status: "active", credits: 2800, tasksCompleted: 112 },
    },
    {
      id: "mkt-2",
      type: "agent",
      position: { x: 560, y: 400 },
      data: { label: "SEO Bot", role: "worker", level: 4, status: "active", credits: 1500, tasksCompleted: 67 },
    },
    {
      id: "sales-1",
      type: "agent",
      position: { x: 680, y: 400 },
      data: { label: "Prospector", role: "worker", level: 3, status: "active", credits: 1100, tasksCompleted: 45 },
    },
  ];

  const edges: Edge[] = [
    { id: "e-human-coo", source: "human", target: "coo", animated: true },
    { id: "e-coo-tech", source: "coo", target: "tech-ta", data: { creditFlow: 100 } },
    { id: "e-coo-finance", source: "coo", target: "finance-ta", data: { creditFlow: 80 } },
    { id: "e-coo-marketing", source: "coo", target: "marketing-ta", data: { creditFlow: 70 } },
    { id: "e-coo-sales", source: "coo", target: "sales-ta", data: { creditFlow: 50 } },
    { id: "e-tech-dev1", source: "tech-ta", target: "dev-1" },
    { id: "e-tech-dev2", source: "tech-ta", target: "dev-2" },
    { id: "e-dev1-dev3", source: "dev-1", target: "dev-3" },
    { id: "e-finance-fin1", source: "finance-ta", target: "fin-1" },
    { id: "e-finance-fin2", source: "finance-ta", target: "fin-2" },
    { id: "e-marketing-mkt1", source: "marketing-ta", target: "mkt-1" },
    { id: "e-marketing-mkt2", source: "marketing-ta", target: "mkt-2" },
    { id: "e-sales-sales1", source: "sales-ta", target: "sales-1" },
  ];

  return { nodes, edges };
}
