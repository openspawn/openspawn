import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, Zap, MessageSquare, CreditCard, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAgentAvatarUrl } from '../lib/avatar';
import type { ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'task' | 'message' | 'credit' | 'agent';
  title: string;
  message?: string;
  agentId?: string;
  agentLevel?: number;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  task: { icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  message: { icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  credit: { icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  agent: { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

// Demo notifications that simulate real activity
const demoNotifications: Omit<Notification, 'id' | 'timestamp'>[] = [
  { type: 'task', title: 'Task Completed', message: 'Code Wizard finished API-001', agentId: 'code-wizard', agentLevel: 8 },
  { type: 'message', title: 'New Message', message: 'Talent Agent → Research Bot', agentId: 'talent-agent', agentLevel: 10 },
  { type: 'credit', title: 'Credits Earned', message: '+500 credits for task completion', agentId: 'code-wizard', agentLevel: 8 },
  { type: 'agent', title: 'Agent Active', message: 'Research Bot started working', agentId: 'research-bot', agentLevel: 6 },
  { type: 'success', title: 'Deployment Ready', message: 'API endpoints deployed successfully' },
  { type: 'task', title: 'Task Assigned', message: 'DOC-042 assigned to Content Crafter', agentId: 'content-crafter', agentLevel: 5 },
  { type: 'warning', title: 'Budget Alert', message: 'Code Wizard at 80% budget' },
  { type: 'agent', title: 'New Agent', message: 'Junior Helper joined the team', agentId: 'junior-helper', agentLevel: 2 },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 5));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications((prev) => {
        const now = Date.now();
        return prev.filter((n) => now - n.timestamp.getTime() < 5000);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Demo mode: simulate random notifications
  useEffect(() => {
    const isDemo = window.location.search.includes('demo=true');
    if (!isDemo) return;

    const interval = setInterval(() => {
      const randomNotif = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
      addNotification(randomNotif);
    }, 8000);

    // Initial notification
    setTimeout(() => addNotification(demoNotifications[0]), 2000);

    return () => clearInterval(interval);
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationToasts />
    </NotificationContext.Provider>
  );
}

function NotificationToasts() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg min-w-[320px] max-w-[400px]',
                config.bg
              )}
            >
              {notification.agentId ? (
                <img
                  src={getAgentAvatarUrl(notification.agentId, notification.agentLevel || 5)}
                  alt=""
                  className="w-10 h-10 rounded-full ring-2 ring-white/20"
                />
              ) : (
                <div className={cn('p-2 rounded-full', config.bg)}>
                  <Icon className={cn('w-5 h-5', config.color)} />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{notification.title}</p>
                {notification.message && (
                  <p className="text-sm text-slate-300 truncate">{notification.message}</p>
                )}
              </div>

              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
