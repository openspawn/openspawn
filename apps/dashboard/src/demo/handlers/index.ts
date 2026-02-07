import { agentHandlers, setAgents, getAgents, updateAgent, addAgent } from './agents';
import { taskHandlers, setTasks, getTasks, updateTask, addTask } from './tasks';
import { creditHandlers, setCredits, getCredits, addCredit } from './credits';
import { eventHandlers, setEvents, getEvents, addEvent } from './events';

// Re-export state management functions for simulation engine
export {
  setAgents,
  getAgents,
  updateAgent,
  addAgent,
  setTasks,
  getTasks,
  updateTask,
  addTask,
  setCredits,
  getCredits,
  addCredit,
  setEvents,
  getEvents,
  addEvent,
};

// Combined handlers for MSW
export const handlers = [
  ...agentHandlers,
  ...taskHandlers,
  ...creditHandlers,
  ...eventHandlers,
];
