import React from 'react';
import { MODELS } from '../../constants';

interface ModelSelectorProps {
  japanModel: string;
  setJapanModel: (model: string) => void;
  globalModel: string;
  setGlobalModel: (model: string) => void;
  isActive: boolean;
}

export const ModelSelector = React.memo(function ModelSelector({
  japanModel,
  setJapanModel,
  globalModel,
  setGlobalModel,
  isActive
}: ModelSelectorProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-2">Model Configuration</h2>
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        {(
          [
            ['Japan Model', japanModel, setJapanModel],
            ['Global Model', globalModel, setGlobalModel],
          ] as const
        ).map(([label, value, setter]) => (
          <div key={label} className="space-y-1">
            <label className="text-[12px] uppercase opacity-40">{label}</label>
            <select
              value={value as string}
              onChange={e => setter(e.target.value)}
              disabled={isActive}
              className="w-full bg-[#2A2A2A] border border-white/5 rounded px-2 py-1.5 text-xs outline-none"
            >
              <optgroup label="Gemini" className="bg-[#1A1A1A]">
                {MODELS.filter(m => m.provider === 'gemini').map(m => (
                  <option key={m.id} value={m.id} className="bg-[#1A1A1A]">
                    {m.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Claude (Vertex AI)" className="bg-[#1A1A1A]">
                {MODELS.filter(m => m.provider === 'claude-vertex').map(m => (
                  <option key={m.id} value={m.id} className="bg-[#1A1A1A]">
                    {m.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        ))}
      </div>
    </section>
  );
});
