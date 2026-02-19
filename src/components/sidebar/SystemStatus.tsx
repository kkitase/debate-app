import React from 'react';
import { Terminal, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';

interface SystemStatusProps {
  status: string;
  turnCount: number;
  maxTurns: number;
  isActive: boolean;
  error: string | null;
}

export const SystemStatus = React.memo(function SystemStatus({
  status,
  turnCount,
  maxTurns,
  isActive,
  error
}: SystemStatusProps) {
  return (
    <section className="p-4 rounded-lg border border-[#2A2A2A] bg-black/20">
      <h2 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
        <Terminal className="w-3 h-3" /> System Status
      </h2>
      <div className="space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="opacity-50">Status:</span>
          <span
            className={cn(
              status === 'debating' && 'text-emerald-400 animate-pulse',
              status === 'concluding' && 'text-amber-400 animate-pulse',
              status === 'done' && 'text-emerald-400',
              status === 'idle' && 'text-gray-500',
            )}
          >
            {status.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">Turns:</span>
          <span>{turnCount} / {maxTurns}</span>
        </div>
        {/* Progress bar */}
        {isActive && (
          <div className="mt-2 h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(turnCount / maxTurns) * 100}%` }}
            />
          </div>
        )}
        {error && (
          <div className="mt-4 p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded flex items-start gap-2">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </section>
  );
});
