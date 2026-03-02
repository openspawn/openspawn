import { toast } from 'sonner';

export const notify = {
  success: (message: string) => toast.success(message, {
    style: { background: 'rgb(15, 23, 42)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'rgb(203, 213, 225)' },
  }),
  error: (message: string) => toast.error(message, {
    style: { background: 'rgb(15, 23, 42)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'rgb(203, 213, 225)' },
  }),
  info: (message: string) => toast(message, {
    style: { background: 'rgb(15, 23, 42)', border: '1px solid rgba(34, 211, 238, 0.2)', color: 'rgb(203, 213, 225)' },
  }),
  agent: (agentName: string, action: string) => toast(`${agentName} ${action}`, {
    style: { background: 'rgb(15, 23, 42)', border: '1px solid rgba(34, 211, 238, 0.2)', color: 'rgb(203, 213, 225)' },
    icon: '🤖',
  }),
  task: (message: string) => toast(message, {
    style: { background: 'rgb(15, 23, 42)', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'rgb(203, 213, 225)' },
    icon: '📋',
  }),
  escalation: (message: string) => toast.warning(message, {
    style: { background: 'rgb(15, 23, 42)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'rgb(203, 213, 225)' },
    icon: '⚠️',
  }),
};
