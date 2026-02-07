import { graphql, HttpResponse } from 'msw';
import type { DemoTask, DemoAgent } from '@openspawn/demo-data';
import { getAgents } from './agents';

let tasks: DemoTask[] = [];

export function setTasks(newTasks: DemoTask[]) {
  tasks = [...newTasks];
}

export function getTasks() {
  return tasks;
}

export function updateTask(id: string, updates: Partial<DemoTask>) {
  const index = tasks.findIndex(t => t.id === id);
  if (index >= 0) {
    tasks[index] = { ...tasks[index], ...updates };
  }
}

export function addTask(task: DemoTask) {
  tasks.push(task);
}

// GraphQL type mapping - must match Tasks query fields
function mapTask(task: DemoTask) {
  const agents = getAgents();
  const assignee = task.assigneeId ? agents.find(a => a.id === task.assigneeId) : null;

  return {
    id: task.id,
    identifier: task.identifier,
    title: task.title,
    description: task.description || null,
    status: task.status.toUpperCase(), // GraphQL expects uppercase
    priority: task.priority.toUpperCase(),
    assigneeId: task.assigneeId || null,
    assignee: assignee ? {
      id: assignee.id,
      name: assignee.name,
    } : null,
    creatorId: task.creatorId,
    approvalRequired: false,
    dueDate: null,
    completedAt: task.completedAt || null,
    createdAt: task.createdAt,
  };
}

export const taskHandlers = [
  // Tasks query
  graphql.query('Tasks', () => {
    console.log('[MSW] Tasks query intercepted, returning', tasks.length, 'tasks');
    return HttpResponse.json({
      data: {
        tasks: tasks.map(mapTask),
      },
    });
  }),

  // Task query (single)
  graphql.query('Task', ({ variables }) => {
    const task = tasks.find(t => t.id === variables.id);
    return HttpResponse.json({
      data: {
        task: task ? mapTask(task) : null,
      },
    });
  }),
];
