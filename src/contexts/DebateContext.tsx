import React, { createContext, useContext, ReactNode } from 'react';
import type { Message, StreamingMessage, DebateStatus } from '../types';

interface DebateContextType {
  status: DebateStatus;
  turnCount: number;
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  conclusionStreaming: string | null;
  conclusion: string | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

const DebateContext = createContext<DebateContextType | undefined>(undefined);

export function DebateProvider({ value, children }: { value: DebateContextType, children: ReactNode }) {
  return (
    <DebateContext.Provider value={value}>
      {children}
    </DebateContext.Provider>
  );
}

export function useDebateContext() {
  const context = useContext(DebateContext);
  if (context === undefined) {
    throw new Error('useDebateContext must be used within a DebateProvider');
  }
  return context;
}
