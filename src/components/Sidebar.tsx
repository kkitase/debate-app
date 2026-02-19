import React, { useState } from 'react';
import { Settings, XCircle, Languages, Sliders, FileUp, Terminal, AlertCircle } from 'lucide-react';
import { cn } from '../utils';
import { useAppState } from '../contexts/AppStateContext';
import { useDebateContext } from '../contexts/DebateContext';
import type { Persona, PersonaConfig } from '../types';
import { PersonaCard } from './PersonaCard';
import { MobileSettings } from './sidebar/MobileSettings';
import { ModelSelector } from './sidebar/ModelSelector';
import { SystemStatus } from './sidebar/SystemStatus';

export function Sidebar({ showSidebar, setShowSidebar }: { showSidebar: boolean; setShowSidebar: (show: boolean) => void }) {
  const {
    language, setLanguage,
    responseLength, setResponseLength,
    maxTurns, setMaxTurns,
    japanModel, setJapanModel,
    globalModel, setGlobalModel,
    reportContext, setReportContext,
    additionalContext, setAdditionalContext,
    personas, updatePersona, resetPersona
  } = useAppState();

  const debate = useDebateContext();
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const isActive = debate.status === 'debating' || debate.status === 'concluding';

  return (
    <>
      <aside className={cn(
        "border-r border-[#2A2A2A] p-6 overflow-y-auto bg-[#181818] space-y-8 z-40 transition-transform lg:translate-x-0 lg:static fixed inset-y-0 left-0 w-[320px] lg:w-auto shrink-0",
        showSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <span className="text-sm font-bold uppercase tracking-widest text-emerald-500">Configuration</span>
          <button 
            onClick={() => setShowSidebar(false)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <XCircle className="w-5 h-5 opacity-40" />
          </button>
        </div>

        {/* Mobile Settings (Language, Length, Turns) */}
        <MobileSettings
          language={language}
          setLanguage={setLanguage}
          responseLength={responseLength}
          setResponseLength={setResponseLength}
          maxTurns={maxTurns}
          setMaxTurns={setMaxTurns}
          isActive={isActive}
        />

        {/* Report Context */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
            <FileUp className="w-3 h-3" /> Report / Context to Refine
          </h2>
          <textarea
            value={reportContext}
            onChange={e => setReportContext(e.target.value)}
            placeholder="Paste an existing report, whitepaper draft, or market assumption here..."
            disabled={isActive}
            className="w-full h-24 bg-black/30 border border-[#2A2A2A] rounded-lg p-3 text-sm leading-relaxed outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
        </section>

        {/* Additional Constraints */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
            <Settings className="w-3 h-3" /> Additional Constraints
          </h2>
          <textarea
            value={additionalContext}
            onChange={e => setAdditionalContext(e.target.value)}
            placeholder="e.g. 'We cannot send many emails, so prioritize high-impact campaigns'..."
            disabled={isActive}
            className="w-full h-24 bg-black/30 border border-[#2A2A2A] rounded-lg p-3 text-sm leading-relaxed outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
        </section>

        {/* Model Selection */}
        <ModelSelector
          japanModel={japanModel}
          setJapanModel={setJapanModel}
          globalModel={globalModel}
          setGlobalModel={setGlobalModel}
          isActive={isActive}
        />

        {/* Personas */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-4">Participants</h2>
          <div className="space-y-4">
            {(Object.entries(personas) as [Persona, PersonaConfig][]).map(([key, p]) => (
              <PersonaCard
                key={key}
                personaKey={key}
                persona={p}
                isEditing={editingPersona === key}
                onToggleEdit={() => setEditingPersona(editingPersona === key ? null : key)}
                onUpdate={(field, value) => updatePersona(key, field, value)}
                onReset={() => resetPersona(key)}
                disabled={isActive}
              />
            ))}
          </div>
        </section>

        {/* System Status */}
        <SystemStatus
          status={debate.status}
          turnCount={debate.turnCount}
          maxTurns={maxTurns}
          isActive={isActive}
          error={debate.error}
        />
      </aside>

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-in fade-in duration-300" 
          onClick={() => setShowSidebar(false)}
        />
      )}
    </>
  );
}
