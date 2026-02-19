import React from 'react';
import { Play, Globe, XCircle, Languages, Sliders, Download } from 'lucide-react';
import { cn, exportAsMarkdown } from '../utils';
import { useAppState } from '../contexts/AppStateContext';
import { useDebateContext } from '../contexts/DebateContext';
import { LANGUAGES, LENGTHS } from '../constants';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const { language, setLanguage, responseLength, setResponseLength, maxTurns, setMaxTurns, personas } = useAppState();
  const debate = useDebateContext();
  const { user, signOut } = useAuth();
  const isActive = debate.status === 'debating' || debate.status === 'concluding';

  const handleExport = () => {
    exportAsMarkdown(debate.messages, personas, debate.conclusion);
  };

  return (
    <header className="border-b border-[#2A2A2A] bg-[#1A1A1A]/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-black" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-xs font-bold tracking-tight uppercase">Strategy Lab</h1>
            <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">AI Debate Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <Languages className="w-3 h-3 opacity-40" />
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                disabled={isActive}
                className="bg-transparent border-b border-white/20 outline-none cursor-pointer"
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value} className="bg-[#1A1A1A]">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Sliders className="w-3 h-3 opacity-40" />
              <select
                value={responseLength}
                onChange={e => setResponseLength(e.target.value)}
                disabled={isActive}
                className="bg-transparent border-b border-white/20 outline-none cursor-pointer"
              >
                {LENGTHS.map(l => (
                  <option key={l.value} value={l.value} className="bg-[#1A1A1A]">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-40">TURNS:</span>
              <input
                type="number"
                min="2"
                max="12"
                value={maxTurns}
                onChange={e => setMaxTurns(parseInt(e.target.value))}
                disabled={isActive}
                className="w-10 bg-transparent border-b border-white/20 outline-none text-center"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {debate.status === 'done' && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-[#2A2A2A] hover:bg-[#333] transition-all active:scale-95 border border-white/10"
              >
                <Download className="w-3 h-3 md:block hidden" />
                <span className="md:inline hidden">Export</span>
                <Download className="w-4 h-4 md:hidden block" />
              </button>
            )}

            {isActive ? (
              <button
                onClick={debate.stop}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-400 transition-all active:scale-95"
              >
                <XCircle className="w-3 h-3" />
                <span className="md:inline hidden">Stop</span>
              </button>
            ) : (
              <button
                onClick={debate.start}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 transition-all active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="md:inline hidden">{debate.status === 'done' ? 'Restart' : 'Start Debate'}</span>
                <span className="md:hidden inline">{debate.status === 'done' ? 'Re' : 'Start'}</span>
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-[#2A2A2A]">
                <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
                <button
                  onClick={signOut}
                  className="text-[10px] uppercase opacity-40 hover:opacity-100 transition-opacity hidden sm:block"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
