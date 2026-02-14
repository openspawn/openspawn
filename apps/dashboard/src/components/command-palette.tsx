import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Coins,
  Activity,
  Settings,
  MessageSquare,
  Network,
  Search,
  Plus,
  Play,
  Bot,
} from 'lucide-react';

const pages = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Credits', href: '/credits', icon: Coins },
  { name: 'Events', href: '/events', icon: Activity },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Network', href: '/network', icon: Network },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const actions = [
  { name: 'Create task', keywords: 'new add task', href: '/tasks' },
  { name: 'Start demo', keywords: 'demo play run', href: '/?demo=true' },
];

const demoAgents = [
  { name: 'Alpha', role: 'Task Runner', id: 'alpha' },
  { name: 'Bravo', role: 'Load Balancer', id: 'bravo' },
  { name: 'Charlie', role: 'Code Reviewer', id: 'charlie' },
  { name: 'Delta', role: 'Security Analyst', id: 'delta' },
  { name: 'Echo', role: 'Cost Optimizer', id: 'echo' },
  { name: 'Foxtrot', role: 'Data Analyst', id: 'foxtrot' },
  { name: 'Golf', role: 'Log Monitor', id: 'golf' },
  { name: 'Hotel', role: 'AI Assistant', id: 'hotel' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-[101] w-full max-w-lg"
          >
            <Command
              className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
            >
              <div className="flex items-center border-b border-border px-4">
                <Search className="mr-2 h-4 w-4 shrink-0 text-primary/60" />
                <Command.Input
                  autoFocus
                  placeholder="Search pages, actions, agents..."
                  className="flex h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Pages"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-primary/70"
                >
                  {pages.map((page) => (
                    <Command.Item
                      key={page.href}
                      value={page.name}
                      onSelect={() => runCommand(() => navigate({ to: page.href }))}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 cursor-pointer aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
                    >
                      <page.icon className="h-4 w-4 text-muted-foreground" />
                      {page.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border" />

                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-primary/70"
                >
                  {actions.map((action) => (
                    <Command.Item
                      key={action.name}
                      value={`${action.name} ${action.keywords}`}
                      onSelect={() => runCommand(() => navigate({ to: action.href }))}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 cursor-pointer aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
                    >
                      {action.name === 'Create task' ? (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Play className="h-4 w-4 text-muted-foreground" />
                      )}
                      {action.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border" />

                <Command.Group
                  heading="Agents"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-primary/70"
                >
                  {demoAgents.map((agent) => (
                    <Command.Item
                      key={agent.id}
                      value={`${agent.name} ${agent.role}`}
                      onSelect={() => runCommand(() => navigate({ to: '/agents' }))}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 cursor-pointer aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
                    >
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span>{agent.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {agent.role}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">↑↓</kbd>
                  <span>navigate</span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">↵</kbd>
                  <span>select</span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
                  <span>close</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
