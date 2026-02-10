import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Bot, CheckSquare, MessageSquare, Coins, AlertTriangle, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotifications } from './live-notifications';
import type { NotificationType } from './live-notifications';

const typeConfig: Record<NotificationType, { icon: typeof Bell; label: string; accent: string; border: string; bg: string }> = {
  agent:   { icon: Bot,            label: 'Agent',   accent: 'text-emerald-400', border: 'border-l-emerald-500', bg: 'bg-emerald-500/5' },
  task:    { icon: CheckSquare,    label: 'Task',    accent: 'text-cyan-400',    border: 'border-l-cyan-500',    bg: 'bg-cyan-500/5' },
  message: { icon: MessageSquare,  label: 'Message', accent: 'text-violet-400',  border: 'border-l-violet-500',  bg: 'bg-violet-500/5' },
  credit:  { icon: Coins,          label: 'Credit',  accent: 'text-amber-400',   border: 'border-l-amber-500',   bg: 'bg-amber-500/5' },
  system:  { icon: AlertTriangle,  label: 'System',  accent: 'text-rose-400',    border: 'border-l-rose-500',    bg: 'bg-rose-500/5' },
};

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Delay to avoid the bell click triggering close
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel Overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] flex flex-col bg-popover/95 backdrop-blur-md border-l border-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <span className="text-4xl mb-2">🌊</span>
                    <p className="text-sm">All caught up!</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notification, i) => {
                      const config = typeConfig[notification.type];
                      const Icon = config.icon;

                      return (
                        <motion.button
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => markAsRead(notification.id)}
                          className={cn(
                            'w-full text-left px-5 py-3.5 border-l-2 transition-colors hover:bg-muted/60',
                            notification.read
                              ? 'border-l-transparent bg-transparent'
                              : cn(config.border, config.bg)
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('mt-0.5 p-1.5 rounded-md', notification.read ? 'bg-muted' : config.bg)}>
                              <Icon className={cn('h-4 w-4', notification.read ? 'text-muted-foreground' : config.accent)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn('text-sm font-medium truncate', notification.read ? 'text-muted-foreground' : 'text-foreground')}>
                                  {notification.title}
                                </p>
                                <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap">
                                  {relativeTime(notification.timestamp)}
                                </span>
                              </div>
                              <p className={cn('text-xs mt-0.5 line-clamp-2', notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
                                {notification.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
