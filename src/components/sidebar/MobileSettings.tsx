import React from 'react';
import { Languages, Sliders } from 'lucide-react';
import { LANGUAGES, LENGTHS } from '../../constants';

interface MobileSettingsProps {
  language: string;
  setLanguage: (lang: string) => void;
  responseLength: string;
  setResponseLength: (len: string) => void;
  maxTurns: number;
  setMaxTurns: (turns: number) => void;
  isActive: boolean;
}

export const MobileSettings = React.memo(function MobileSettings({
  language,
  setLanguage,
  responseLength,
  setResponseLength,
  maxTurns,
  setMaxTurns,
  isActive
}: MobileSettingsProps) {
  return (
    <div className="lg:hidden space-y-6 pb-6 border-b border-white/5 font-mono">
      <div className="space-y-3">
        <label className="text-[10px] uppercase opacity-40 flex items-center gap-2">
          <Languages className="w-3 h-3" /> Language
        </label>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          disabled={isActive}
          className="w-full bg-[#2A2A2A] border border-white/5 rounded px-3 py-2 text-xs outline-none"
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value} className="bg-[#1A1A1A]">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] uppercase opacity-40 flex items-center gap-2">
          <Sliders className="w-3 h-3" /> Response Length
        </label>
        <select
          value={responseLength}
          onChange={e => setResponseLength(e.target.value)}
          disabled={isActive}
          className="w-full bg-[#2A2A2A] border border-white/5 rounded px-3 py-2 text-xs outline-none"
        >
          {LENGTHS.map(l => (
            <option key={l.value} value={l.value} className="bg-[#1A1A1A]">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] uppercase opacity-40 flex items-center gap-2">
            Turns
        </label>
        <input
          type="number"
          min="2"
          max="12"
          value={maxTurns}
          onChange={e => setMaxTurns(parseInt(e.target.value))}
          disabled={isActive}
          className="w-full bg-[#2A2A2A] border border-white/5 rounded px-3 py-2 text-xs outline-none"
        />
      </div>
    </div>
  );
});
