/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Settings,
  Play,
  Globe,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Terminal,
  FileText,
  XCircle,
  Languages,
  Sliders,
  FileUp,
  Edit3,
  Copy,
  Check,
  Download,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn, copyToClipboard, exportAsMarkdown } from './utils';
import { useDebate } from './hooks/useDebate';
import { DEFAULT_PERSONAS, MODELS, LANGUAGES, LENGTHS } from './constants';
import type { Persona, PersonaConfig } from './types';
import { auth, googleProvider, db } from './lib/firebase';
import { onIdTokenChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// --- CopyButton ---

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copy to clipboard"
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase transition-all',
        'bg-white/5 hover:bg-white/10 border border-white/10',
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// --- PersonaCard ---

function PersonaCard({
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

// --- MessageBubble ---

function MessageBubble({
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
            'p-5 rounded-2xl text-sm leading-relaxed border shadow-xl relative group/msg',
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

// --- Main App ---

export default function App() {
  const [japanModel, setJapanModel] = useState(MODELS[0].id);
  const [globalModel, setGlobalModel] = useState(MODELS[0].id);
  const [maxTurns, setMaxTurns] = useState(6);
  const [language, setLanguage] = useState('Japanese');
  const [responseLength, setResponseLength] = useState('Normal (about 3-4 paragraphs)');
  const [reportContext, setReportContext] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check whitelist
        try {
          const email = firebaseUser.email;
          if (!email) throw new Error('Email not found');
          
          const userDoc = await getDoc(doc(db, 'allowed_users', email));
          if (userDoc.exists()) {
            setIsAllowed(true);
            setUser(firebaseUser);
            const token = await firebaseUser.getIdToken();
            setIdToken(token);
          } else {
            console.error('[auth] User not in whitelist:', email);
            setIsAllowed(false);
            setUser(null);
            setIdToken(null);
            await signOut(auth);
          }
        } catch (err) {
          console.error('[auth] Error checking whitelist:', err);
          setIsAllowed(false);
          await signOut(auth);
        }
      } else {
        setUser(null);
        setIdToken(null);
        setIsAllowed(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const debate = useDebate({
    japanModel,
    globalModel,
    maxTurns,
    language,
    responseLength,
    reportContext,
    additionalContext,
    personas,
  }, idToken);

  const isActive = debate.status === 'debating' || debate.status === 'concluding';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debate.messages, debate.streamingMessage, debate.conclusionStreaming]);

  const updatePersona = (key: Persona, field: keyof PersonaConfig, value: string) => {
    setPersonas(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const resetPersona = (key: Persona) => {
    setPersonas(prev => ({ ...prev, [key]: DEFAULT_PERSONAS[key] }));
  };

  const handleExport = () => {
    exportAsMarkdown(debate.messages, personas, debate.conclusion);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#141414] text-[#E4E3E0] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Globe className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif italic text-emerald-400">Strategy Lab</h1>
            <p className="text-sm opacity-60">AI Debate Simulator & Market Readiness Refiner</p>
          </div>
          <p className="text-xs leading-relaxed opacity-40 font-mono uppercase tracking-widest">
            Authentication Required to Access Vertex AI & Gemini Models
          </p>
          {isAllowed === false && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in zoom-in duration-300">
              <p className="text-red-400 text-xs">ごめんなさい、あなたのメールアドレスは許可リストにありません。管理者に連絡してくださいわ。🌹</p>
            </div>
          )}
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#E4E3E0] font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-[#2A2A2A] bg-[#1A1A1A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
              <Globe className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase">Strategy Lab</h1>
              <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">AI Debate Simulator</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <div className="flex items-center gap-3 pr-4 border-r border-[#2A2A2A]">
                <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                <button 
                  onClick={() => signOut(auth)}
                  className="text-[10px] uppercase opacity-40 hover:opacity-100 transition-opacity"
                >
                  Sign Out
                </button>
              </div>
            )}
            <div className="flex items-center gap-4 text-[11px] font-mono">
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

            {debate.status === 'done' && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-[#2A2A2A] hover:bg-[#333] transition-all active:scale-95 border border-white/10"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            )}

            {isActive ? (
              <button
                onClick={debate.stop}
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-400 transition-all active:scale-95"
              >
                <XCircle className="w-3 h-3" />
                Stop
              </button>
            ) : (
              <button
                onClick={debate.start}
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 transition-all active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                {debate.status === 'done' ? 'Restart' : 'Start Debate'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] h-[calc(100vh-96px)]">
        {/* Sidebar */}
        <aside className="border-r border-[#2A2A2A] p-6 overflow-y-auto bg-[#181818] space-y-8">
          {/* Report Context */}
          <section>
            <h2 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
              <FileUp className="w-3 h-3" /> Report / Context to Refine
            </h2>
            <textarea
              value={reportContext}
              onChange={e => setReportContext(e.target.value)}
              placeholder="Paste an existing report, whitepaper draft, or market assumption here..."
              disabled={isActive}
              className="w-full h-24 bg-black/30 border border-[#2A2A2A] rounded-lg p-3 text-xs leading-relaxed outline-none focus:border-emerald-500/50 transition-colors resize-none"
            />
          </section>

          {/* Additional Constraints */}
          <section>
            <h2 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
              <Settings className="w-3 h-3" /> Additional Constraints
            </h2>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. 'We cannot send many emails, so prioritize high-impact campaigns'..."
              disabled={isActive}
              className="w-full h-24 bg-black/30 border border-[#2A2A2A] rounded-lg p-3 text-xs leading-relaxed outline-none focus:border-emerald-500/50 transition-colors resize-none"
            />
          </section>

          {/* Model Selection */}
          <section className="space-y-4">
            <h2 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">Model Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ['Japan Model', japanModel, setJapanModel],
                  ['Global Model', globalModel, setGlobalModel],
                ] as const
              ).map(([label, value, setter]) => (
                <div key={label} className="space-y-1">
                  <label className="text-[9px] uppercase opacity-40">{label}</label>
                  <select
                    value={value}
                    onChange={e => setter(e.target.value)}
                    disabled={isActive}
                    className="w-full bg-[#2A2A2A] border border-white/5 rounded px-2 py-1.5 text-[10px] outline-none"
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

          {/* Personas */}
          <section>
            <h2 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-4">Participants</h2>
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
          <section className="p-4 rounded-lg border border-[#2A2A2A] bg-black/20">
            <h2 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> System Status
            </h2>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="opacity-50">Status:</span>
                <span
                  className={cn(
                    debate.status === 'debating' && 'text-emerald-400 animate-pulse',
                    debate.status === 'concluding' && 'text-amber-400 animate-pulse',
                    debate.status === 'done' && 'text-emerald-400',
                    debate.status === 'idle' && 'text-gray-500',
                  )}
                >
                  {debate.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">Turns:</span>
                <span>{debate.turnCount} / {maxTurns}</span>
              </div>
              {/* Progress bar */}
              {isActive && (
                <div className="mt-2 h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(debate.turnCount / maxTurns) * 100}%` }}
                  />
                </div>
              )}
              {debate.error && (
                <div className="mt-4 p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{debate.error}</span>
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Chat Feed */}
        <div className="flex flex-col overflow-hidden bg-[#121212]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
            {debate.messages.length === 0 && !isActive && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
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

            {debate.messages.map(m => (
              <MessageBubble
                key={m.id}
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
              <div className="flex items-center gap-3 text-amber-400 text-xs font-mono animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating executive summary...
              </div>
            )}

            {/* Streaming Conclusion */}
            {(debate.conclusionStreaming !== null || debate.conclusion) && (
              <div className="mt-12 p-8 rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group animate-in zoom-in-95 duration-700">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileText className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        {debate.conclusionStreaming !== null && !debate.conclusion ? (
                          <Loader2 className="w-6 h-6 text-black animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-black" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-serif italic text-emerald-400">Strategic Conclusion</h2>
                        <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                          Executive Summary for Global Leadership
                        </p>
                      </div>
                    </div>
                    {debate.conclusion && <CopyButton text={debate.conclusion} />}
                  </div>
                  <div className="prose prose-invert max-w-none prose-p:text-lg prose-p:leading-relaxed prose-strong:text-emerald-400">
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
      </main>

      {/* Status Bar */}
      <footer className="h-8 border-t border-[#2A2A2A] bg-[#1A1A1A] flex items-center px-6 justify-between text-[10px] font-mono opacity-40">
        <div className="flex items-center gap-4">
          <span>STRATEGY LAB</span>
          <span>v2.0</span>
        </div>
        <div>AI DEBATE SIMULATOR · {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
