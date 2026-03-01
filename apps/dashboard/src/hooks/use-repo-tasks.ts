import { useState, useEffect, useCallback } from 'react';

export type RepoTaskStatus = 'open' | 'claimed' | 'in-progress' | 'done' | 'blocked';

export interface RepoTask {
  id: string;
  description: string;
  assignee?: string;
  delegatedBy?: string;
  status: RepoTaskStatus;
  createdAt: string;
  updatedAt: string;
  pr?: number;
  budget?: { spent: number; currency: string };
}

interface TaskStore {
  version: number;
  tasks: RepoTask[];
}

// Try local data first (baked into build), then GitHub, then demo
const LOCAL_URL = '/data/tasks.json';
const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/openspawn/openspawn/main/.openspawn/tasks.json';

const DEMO_TASKS: RepoTask[] = [
  {
    id: 'task-001',
    description: 'Set up CI pipeline for dashboard builds',
    assignee: 'dennis',
    status: 'done',
    createdAt: '2026-02-25T10:00:00Z',
    updatedAt: '2026-02-26T14:30:00Z',
    pr: 450,
  },
  {
    id: 'task-002',
    description: 'Add agent reputation scoring to dashboard',
    assignee: 'ceo',
    status: 'in-progress',
    createdAt: '2026-02-26T09:00:00Z',
    updatedAt: '2026-02-28T16:00:00Z',
    pr: 455,
  },
  {
    id: 'task-003',
    description: 'Implement task delegation protocol',
    status: 'open',
    createdAt: '2026-02-27T11:00:00Z',
    updatedAt: '2026-02-27T11:00:00Z',
  },
  {
    id: 'task-004',
    description: 'Budget tracking per-agent breakdown',
    assignee: 'dennis',
    status: 'in-progress',
    createdAt: '2026-02-27T14:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
    budget: { spent: 0.42, currency: 'USD' },
  },
  {
    id: 'task-005',
    description: 'Wire up escalation alerts to Discord',
    status: 'open',
    delegatedBy: 'ceo',
    createdAt: '2026-02-28T08:00:00Z',
    updatedAt: '2026-02-28T08:00:00Z',
  },
  {
    id: 'task-006',
    description: 'Tone cleanup — additive not competitive',
    assignee: 'dennis',
    status: 'done',
    createdAt: '2026-02-28T12:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    pr: 460,
  },
  {
    id: 'task-007',
    description: 'Add kanban board route to dashboard',
    assignee: 'dennis',
    status: 'in-progress',
    createdAt: '2026-03-01T15:00:00Z',
    updatedAt: '2026-03-01T15:00:00Z',
  },
  {
    id: 'task-008',
    description: 'Review and merge infrastructure docs',
    status: 'blocked',
    assignee: 'ceo',
    createdAt: '2026-02-28T10:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
];

const REFRESH_INTERVAL = 30_000;

export function useRepoTasks() {
  const [tasks, setTasks] = useState<RepoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'github' | 'demo'>('demo');

  const fetchTasks = useCallback(async () => {
    try {
      // Try local static file first (baked into Docker build)
      let res = await fetch(LOCAL_URL, { cache: 'no-store' });
      let src: 'github' | 'demo' = 'github';
      if (!res.ok) {
        // Fall back to GitHub raw content
        res = await fetch(GITHUB_RAW_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      const data: TaskStore = await res.json();
      setTasks(data.tasks);
      setSource(src);
      setError(null);
    } catch {
      setTasks(DEMO_TASKS);
      setSource('demo');
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchTasks]);

  return { tasks, loading, error, source, refetch: fetchTasks };
}
