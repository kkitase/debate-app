import React, { useEffect, useRef } from 'react';
import { MessageSquare, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { useAppState } from '../contexts/AppStateContext';
import { useDebateContext } from '../contexts/DebateContext';
import { MessageBubble } from './MessageBubble';
import { CopyButton } from './CopyButton';

export function ChatFeed() {
  const { personas } = useAppState();
  const debate = useDebateContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isActive = debate.status === 'debating' || debate.status === 'concluding';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debate.messages, debate.streamingMessage, debate.conclusionStreaming]);

  return (
    <div className="flex flex-col overflow-hidden bg-[#121212] relative h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 space-y-6 md:space-y-8 scroll-smooth">
        {debate.messages.length === 0 && !isActive && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 px-4">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 opacity-20" />
            </div>
            <h3 className="text-lg font-serif italic">Ready for Simulation</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Configure your participants, set the context, and start the debate. The AI participants will challenge
              each other's perspectives to find the best strategy.
            </p>
          </div>
        )}

        {debate.messages.map((m, idx) => (
          <MessageBubble
            key={m.id || idx}
            role={m.role}
            content={m.content}
            model={m.model}
            persona={personas[m.role]}
          />
        ))}

        {debate.streamingMessage && (
          <MessageBubble
            role={debate.streamingMessage.role}
            content={debate.streamingMessage.content}
            model={debate.streamingMessage.model}
            persona={personas[debate.streamingMessage.role]}
            isStreaming
          />
        )}

        {/* Concluding state indicator */}
        {debate.status === 'concluding' && !debate.conclusionStreaming && (
          <div className="flex items-center gap-3 text-amber-400 text-xs font-mono animate-pulse p-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating executive summary...
          </div>
        )}

        {/* Streaming Conclusion */}
        {(debate.conclusionStreaming !== null || debate.conclusion) && (
          <div className="mt-12 p-4 md:p-8 rounded-2xl md:rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group animate-in zoom-in-95 duration-700">
            <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-24 h-24 md:w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    {debate.conclusionStreaming !== null && !debate.conclusion ? (
                      <Loader2 className="w-6 h-6 text-black animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-black" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-serif italic text-emerald-400 leading-tight">Strategic Conclusion</h2>
                    <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest opacity-60">
                      Executive Summary for Global Leadership
                    </p>
                  </div>
                </div>
                <div className="self-end sm:self-auto">
                  {debate.conclusion && <CopyButton text={debate.conclusion} />}
                </div>
              </div>
              <div className="prose prose-invert max-w-none prose-p:text-base md:prose-p:text-lg prose-p:leading-relaxed prose-strong:text-emerald-400">
                <Markdown>{debate.conclusionStreaming ?? debate.conclusion ?? ''}</Markdown>
              </div>
              {debate.conclusionStreaming !== null && !debate.conclusion && (
                <span className="inline-block w-0.5 h-5 bg-emerald-400 animate-pulse ml-1 align-middle" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
