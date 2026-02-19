import React from 'react';
import { Edit3, RotateCcw } from 'lucide-react';
import { cn } from '../utils';
import type { Persona, PersonaConfig } from '../types';

export function PersonaCard({
  personaKey,
  persona,
  isEditing,
  onToggleEdit,
  onUpdate,
  onReset,
  disabled,
}: {
  personaKey: Persona;
  persona: PersonaConfig;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (field: keyof PersonaConfig, value: string) => void;
  onReset: () => void;
  disabled: boolean;
}) {
  return (
    <div className={cn('p-4 rounded-lg border transition-all relative group', persona.color)}>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onReset}
          disabled={disabled}
          title="Reset to default"
          className="p-1.5 rounded bg-black/20 hover:bg-black/40 disabled:opacity-30"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        <button
          onClick={onToggleEdit}
          disabled={disabled}
          className="p-1.5 rounded bg-black/20 hover:bg-black/40 disabled:opacity-30"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <img
          src={persona.avatar}
          alt={persona.name}
          className="w-10 h-10 rounded-full border border-current/20 object-cover"
          referrerPolicy="no-referrer"
        />
        <div>
          <h3 className="text-xs font-bold">{persona.name}</h3>
          <p className="text-[10px] opacity-70 leading-tight">{persona.title}</p>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {(['name', 'title', 'description'] as const).map(field => (
            <div key={field} className="space-y-1">
              <label className="text-[9px] uppercase opacity-50 capitalize">{field}</label>
              <input
                value={persona[field]}
                onChange={e => onUpdate(field, e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs outline-none"
              />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-[9px] uppercase opacity-50">System Instruction</label>
            <textarea
              value={persona.systemInstruction}
              onChange={e => onUpdate('systemInstruction', e.target.value)}
              className="w-full h-32 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] outline-none resize-none"
            />
          </div>
          <button
            onClick={onToggleEdit}
            className="w-full py-1.5 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold uppercase transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed opacity-80 italic">"{persona.description}"</p>
      )}
    </div>
  );
}
