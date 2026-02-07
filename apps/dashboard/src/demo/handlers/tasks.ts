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

// GraphQL type mapping
function mapTask(task: DemoTask) {
  const agents = getAgents();
  const assignee = task.assigneeId ? agents.find(a => a.id === task.assigneeId) : null;
  const creator = agents.find(a => a.id === task.creatorId);

  return {
    id: task.id,
    identifier: task.identifier,
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    assignee: assignee ? {
      id: assignee.id,
      name: assignee.name,
      agentId: assignee.agentId,
    } : null,
    creator: creator ? {
      id: creator.id,
      name: creator.name,
      agentId: creator.agentId,
    } : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt || null,
  };
}

export const taskHandlers = [
  // GetTasks query
  graphql.query('GetTasks', () => {
    return HttpResponse.json({
      data: {
        tasks: tasks.map(mapTask),
      },
    });
  }),

  // GetTask query
  graphql.query('GetTask', ({ variables }) => {
    const task = tasks.find(t => t.id === variables.id);
    return HttpResponse.json({
      data: {
        task: task ? mapTask(task) : null,
      },
    });
  }),
];
