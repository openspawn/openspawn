import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { isSandboxMode } from '../graphql/fetcher';
import { useSandboxSSE, type SandboxSSEEvent } from '../hooks/use-sandbox-sse';

export type NotificationType = 'agent' | 'task' | 'message' | 'credit' | 'system' | 'success' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  /** Display text for the notification */
  description?: string;
  /** Alias for description — used by settings pages */
  message?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

const demoNotifications: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
  { type: 'agent', title: 'Agent Registered', description: 'Code Wizard has joined the network and is ready for tasks.' },
  { type: 'task', title: 'Task Completed', description: 'API-001 finished successfully by Code Wizard in 3m 42s.' },
  { type: 'message', title: 'New Direct Message', description: 'Talent Agent sent you a message about the deployment.' },
  { type: 'credit', title: 'Low Balance Warning', description: 'Your credit balance is below 500. Consider topping up.' },
  { type: 'system', title: 'System Maintenance', description: 'Scheduled maintenance window tonight at 2:00 AM UTC.' },
  { type: 'agent', title: 'Agent Status Change', description: 'Research Bot went idle after completing 12 tasks.' },
  { type: 'task', title: 'Task Failed', description: 'DOC-042 failed with exit code 1. Check logs for details.' },
  { type: 'message', title: 'Mention in #general', description: 'Content Crafter mentioned you in the general channel.' },
  { type: 'credit', title: 'Credits Earned', description: '+500 credits awarded for completing the API integration sprint.' },
  { type: 'system', title: 'Rate Limit Warning', description: 'Agent Code Wizard approaching API rate limit (85% used).' },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // In sandbox mode: create notifications from real SSE events
  useSandboxSSE(useCallback((event: SandboxSSEEvent) => {
    if (!isSandboxMode) return;
    if (event.type === 'connected') return;

    const typeMap: Record<string, NotificationType> = {
      agent_action: 'agent',
      system: 'system',
      human_order: 'system',
    };

    addNotification({
      type: typeMap[event.type] || 'task',
      title: event.agentName
        ? `${event.agentName} — ${event.type.replace(/_/g, ' ')}`
        : event.type.replace(/_/g, ' '),
      description: event.message || 'Activity detected',
    });
  }, [addNotification]));

  // Seed demo notifications on mount (non-sandbox only)
  useEffect(() => {
    if (isSandboxMode) return;
    const now = Date.now();
    const seeded = demoNotifications.map((n, i) => ({
      ...n,
      id: `demo-${i}`,
      timestamp: new Date(now - (i * 4 + 1) * 60000), // staggered past times
      read: i >= 5, // first 5 unread
    }));
    setNotifications(seeded);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
