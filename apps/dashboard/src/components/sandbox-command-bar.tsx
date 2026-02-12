/**
 * Ghost-typing command bar — showcases the command interface for visitors.
 * Cycles through demo commands with a typewriter effect.
 * Disabled/non-interactive for the public demo.
 */
import { useState, useEffect, useRef } from 'react';
import { Crown } from 'lucide-react';
import { isSandboxMode } from '../graphql/fetcher';

const DEMO_COMMANDS = [
  'Build a user authentication system',
  'Hire two more frontend engineers',
  'What\'s the status of the API integration?',
  'Prioritize the security audit over new features',
  'Scale up the QA team for launch prep',
];

const TYPE_SPEED = 45;    // ms per character
const PAUSE_AFTER = 2500; // ms to show completed text
const PAUSE_BEFORE = 800; // ms before typing next

export function SandboxCommandBar() {
  const [displayText, setDisplayText] = useState('');
  const [commandIndex, setCommandIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!isSandboxMode) return;

    const command = DEMO_COMMANDS[commandIndex % DEMO_COMMANDS.length];
    let charIndex = 0;
    setIsTyping(true);
    setDisplayText('');

    const typeNext = () => {
      if (charIndex <= command.length) {
        setDisplayText(command.slice(0, charIndex));
        charIndex++;
        timeoutRef.current = setTimeout(typeNext, TYPE_SPEED);
      } else {
        setIsTyping(false);
        // Pause, then move to next command
        timeoutRef.current = setTimeout(() => {
          setDisplayText('');
          timeoutRef.current = setTimeout(() => {
            setCommandIndex(i => i + 1);
          }, PAUSE_BEFORE);
        }, PAUSE_AFTER);
      }
    };

    timeoutRef.current = setTimeout(typeNext, PAUSE_BEFORE);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [commandIndex]);

  if (!isSandboxMode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50 bg-slate-950/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Crown className="w-3.5 h-3.5 text-amber-500/60" />
          </div>
          <div className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-slate-400 select-none cursor-default min-h-[38px] flex items-center">
            {displayText}
            {/* Blinking cursor */}
            <span
              className={`inline-block w-[2px] h-4 ml-[1px] rounded-sm ${
                isTyping ? 'bg-cyan-400' : 'bg-slate-500 animate-pulse'
              }`}
            />
          </div>
        </div>
        <span className="text-[10px] text-slate-600 hidden sm:block whitespace-nowrap">
          Command your org →
        </span>
      </div>
    </div>
  );
}
