import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { ArrowRight, Github, BookOpen, Users, Network, CheckSquare, Link2, Plug } from 'lucide-react';
import { useAgents } from '../hooks/use-agents';
import { useTasks } from '../hooks/use-tasks';

export function IntroPage() {
  const navigate = useNavigate();
  const { agents } = useAgents();
  const { tasks } = useTasks();

  const agentCount = agents.length || 23;
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;
  const taskCount = tasks.length || 250;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020817]">
      {/* Bikini Bottom backdrop — higher opacity here than dashboard */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/app/bikini-bottom-bg.jpg)', opacity: 0.15 }}
        aria-hidden="true"
      />
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020817]/60 to-[#020817]" />

      {/* Underwater particle effect — subtle floating dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <span className="text-6xl sm:text-7xl" role="img" aria-label="pineapple">
            🍍
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-4"
        >
          BikiniBottom
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-400 max-w-lg mb-2"
        >
          Multi-Agent Coordination Platform
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-sm text-slate-500 max-w-md mb-10"
        >
          Watch an AI organization of 23 agents handle two client projects simultaneously — hiring, delegating, building, and shipping in real-time.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {[
            { icon: Users, label: `${agentCount} Agents` },
            { icon: Network, label: activeAgents > 0 ? `${activeAgents} Active Now` : 'Live Network' },
            { icon: CheckSquare, label: `${taskCount}+ Tasks`, color: 'text-cyan-400' },
            { icon: Link2, label: 'A2A v0.3', color: 'text-cyan-400', borderColor: 'border-cyan-500/50' },
            { icon: Plug, label: 'MCP 7 tools', color: 'text-violet-400', borderColor: 'border-violet-500/50' },
          ].map(({ icon: Icon, label, color, borderColor }) => (
            <span
              key={label}
              className={`flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border ${borderColor || 'border-slate-700/50'} text-sm text-slate-300`}
            >
              <Icon className={`h-4 w-4 ${color || 'text-cyan-400'}`} />
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate({ to: '/' })}
          className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
        >
          Dive In
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center gap-6 mt-10 text-sm text-slate-500"
        >
          <a
            href="https://github.com/openspawn/openspawn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://openspawn.github.io/openspawn/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Docs
          </a>
        </motion.div>

        {/* Built with OpenSpawn badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="absolute bottom-6 text-xs text-slate-600"
        >
          Built with OpenSpawn
        </motion.div>
      </div>
    </div>
  );
}
