import { agentHandlers, setAgents, getAgents, updateAgent, addAgent } from './agents';
import { taskHandlers, setTasks, getTasks, updateTask, addTask } from './tasks';
import { creditHandlers, setCredits, getCredits, addCredit } from './credits';
import { eventHandlers, setEvents, getEvents, addEvent } from './events';

export const handlers = [
  ...agentHandlers,
  ...taskHandlers,
  ...creditHandlers,
  ...eventHandlers,
];

export const demoState = {
  agents: { set: setAgents, get: getAgents, update: updateAgent, add: addAgent },
  tasks: { set: setTasks, get: getTasks, update: updateTask, add: addTask },
  credits: { set: setCredits, get: getCredits, add: addCredit },
  events: { set: setEvents, get: getEvents, add: addEvent },
};
