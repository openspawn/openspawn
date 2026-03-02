/**
 * Contextual annotations that appear during key demo moments.
 * Each annotation is triggered by a tick range and displayed as a floating bubble.
 */

export interface Annotation {
  id: string;
  triggerTick: number;
  durationTicks: number;
  text: string;
  icon: string;
  color: string; // CSS color for border/icon
}

export const ANNOTATIONS: Annotation[] = [
  {
    id: 'escalation-spongebob',
    triggerTick: 13,
    durationTicks: 6,
    text: '↑ Automatic escalation — agent detected it can\'t handle 10K alone, OpenSpawn routed it up the hierarchy',
    icon: '⬆️',
    color: '#FF4757',
  },
  {
    id: 'spawn-burst',
    triggerTick: 19,
    durationTicks: 10,
    text: '🔥 Dynamic scaling — SpongeBob spawns 20 sous-chefs via sessions_spawn. No human approval needed.',
    icon: '⚡',
    color: '#F4C542',
  },
  {
    id: 'cross-dept',
    triggerTick: 52,
    durationTicks: 8,
    text: '← Cross-department communication via ACP — Support sees Kitchen\'s queue backup in real-time',
    icon: '🔗',
    color: '#4AAED9',
  },
  {
    id: 'escalation-squidward',
    triggerTick: 70,
    durationTicks: 8,
    text: '↑ Automatic escalation — Squidward detected overload, OpenSpawn routed it up the hierarchy',
    icon: '🚨',
    color: '#FF4757',
  },
  {
    id: 'reorg',
    triggerTick: 95,
    durationTicks: 10,
    text: '🔀 Live reorganization — Mr. Krabs reassigns agents across departments. Org chart updates in real-time.',
    icon: '🔀',
    color: '#F4C542',
  },
  {
    id: 'autonomous-milestone',
    triggerTick: 135,
    durationTicks: 10,
    text: 'This org ran autonomously for ~75 seconds. No human touched it.',
    icon: '🏆',
    color: '#4AE88A',
  },
];

export function getActiveAnnotation(tick: number): Annotation | null {
  for (const a of ANNOTATIONS) {
    if (tick >= a.triggerTick && tick < a.triggerTick + a.durationTicks) {
      return a;
    }
  }
  return null;
}
