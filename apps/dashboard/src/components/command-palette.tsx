import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  { name: 'SpongeBob', role: 'Task Runner', id: 'spongebob' },
  { name: 'Patrick', role: 'Load Balancer', id: 'patrick' },
  { name: 'Squidward', role: 'Code Reviewer', id: 'squidward' },
  { name: 'Sandy', role: 'Security Analyst', id: 'sandy' },
  { name: 'Mr. Krabs', role: 'Cost Optimizer', id: 'mrkrabs' },
  { name: 'Plankton', role: 'Data Scraper', id: 'plankton' },
  { name: 'Gary', role: 'Log Monitor', id: 'gary' },
  { name: 'Karen', role: 'AI Assistant', id: 'karen' },
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
              className="rounded-xl border border-cyan-900/50 bg-[#0a1628] shadow-2xl shadow-cyan-500/10 overflow-hidden"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
            >
              <div className="flex items-center border-b border-cyan-900/40 px-4">
                <Search className="mr-2 h-4 w-4 shrink-0 text-cyan-400/60" />
                <Command.Input
                  placeholder="Search pages, actions, agents..."
                  className="flex h-12 w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-slate-500">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Pages"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-cyan-400/70"
                >
                  {pages.map((page) => (
                    <Command.Item
                      key={page.href}
                      value={page.name}
                      onSelect={() => runCommand(() => navigate(page.href))}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 cursor-pointer aria-selected:bg-cyan-500/15 aria-selected:text-cyan-300 transition-colors"
                    >
                      <page.icon className="h-4 w-4 text-slate-500 aria-selected:text-cyan-400" />
                      {page.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-cyan-900/30" />

                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-cyan-400/70"
                >
                  {actions.map((action) => (
                    <Command.Item
                      key={action.name}
                      value={`${action.name} ${action.keywords}`}
                      onSelect={() => runCommand(() => navigate(action.href))}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 cursor-pointer aria-selected:bg-cyan-500/15 aria-selected:text-cyan-300 transition-colors"
                    >
                      {action.name === 'Create task' ? (
                        <Plus className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Play className="h-4 w-4 text-slate-500" />
                      )}
                      {action.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-cyan-900/30" />

                <Command.Group
                  heading="Agents"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-cyan-400/70"
                >
                  {demoAgents.map((agent) => (
                    <Command.Item
                      key={agent.id}
                      value={`${agent.name} ${agent.role}`}
                      onSelect={() => runCommand(() => navigate('/agents'))}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 cursor-pointer aria-selected:bg-cyan-500/15 aria-selected:text-cyan-300 transition-colors"
                    >
                      <Bot className="h-4 w-4 text-slate-500" />
                      <span>{agent.name}</span>
                      <span className="ml-auto text-xs text-slate-600">
                        {agent.role}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-cyan-900/40 px-4 py-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">↑↓</kbd>
                  <span>navigate</span>
                  <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">↵</kbd>
                  <span>select</span>
                  <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">esc</kbd>
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
