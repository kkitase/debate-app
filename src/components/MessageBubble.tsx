import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../utils';
import type { Persona, PersonaConfig } from '../types';
import { CopyButton } from './CopyButton';

export function MessageBubble({
  role,
  content,
  model,
  persona,
  isStreaming = false,
}: {
  role: Persona;
  content: string;
  model: string;
  persona: PersonaConfig;
  isStreaming?: boolean;
}) {
  const isGlobal = role === 'GLOBAL_LEAD';
  return (
    <div
      className={cn(
        'flex gap-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500',
        isGlobal ? 'ml-auto flex-row-reverse' : '',
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full shrink-0 border flex items-center justify-center overflow-hidden',
          persona.color,
        )}
      >
        <img src={persona.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className={cn('flex-1 space-y-2', isGlobal ? 'text-right' : '')}>
        <div className="flex items-center gap-2 text-[10px] font-mono opacity-40 uppercase tracking-widest">
          {isGlobal ? (
            <>
              <span>{model}</span>
              <ChevronRight className="w-3 h-3 rotate-180" />
              <span className="font-bold">{persona.name}</span>
            </>
          ) : (
            <>
              <span className="font-bold">{persona.name}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{model}</span>
            </>
          )}
          {isStreaming && <Loader2 className="w-3 h-3 animate-spin opacity-60" />}
        </div>
        <div
          className={cn(
            'p-4 md:p-5 rounded-2xl text-sm leading-relaxed border shadow-xl relative group/msg',
            isGlobal
              ? 'bg-amber-500/5 border-amber-500/20 rounded-tr-none text-amber-50/90'
              : 'bg-emerald-500/5 border-emerald-500/20 rounded-tl-none text-emerald-50/90',
          )}
        >
          {!isStreaming && (
            <div
              className={cn(
                'absolute top-2 opacity-0 group-hover/msg:opacity-100 transition-opacity',
                isGlobal ? 'left-2' : 'right-2',
              )}
            >
              <CopyButton text={content} />
            </div>
          )}
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:italic">
            <Markdown>{content}</Markdown>
          </div>
          {isStreaming && <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-1 align-middle" />}
        </div>
      </div>
    </div>
  );
}
