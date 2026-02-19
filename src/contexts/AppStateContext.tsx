import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Persona, PersonaConfig } from '../types';
import { DEFAULT_PERSONAS, MODELS } from '../constants';

interface AppStateContextType {
  language: string;
  setLanguage: (val: string) => void;
  responseLength: string;
  setResponseLength: (val: string) => void;
  maxTurns: number;
  setMaxTurns: (val: number) => void;
  japanModel: string;
  setJapanModel: (val: string) => void;
  globalModel: string;
  setGlobalModel: (val: string) => void;
  reportContext: string;
  setReportContext: (val: string) => void;
  additionalContext: string;
  setAdditionalContext: (val: string) => void;
  personas: Record<Persona, PersonaConfig>;
  updatePersona: (key: Persona, field: keyof PersonaConfig, value: string) => void;
  resetPersona: (key: Persona) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('Japanese');
  const [responseLength, setResponseLength] = useState('Normal (about 3-4 paragraphs)');
  const [maxTurns, setMaxTurns] = useState(3);
  const [japanModel, setJapanModel] = useState(MODELS[0].id);
  const [globalModel, setGlobalModel] = useState(MODELS[0].id);
  const [reportContext, setReportContext] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS);

  const updatePersona = (key: Persona, field: keyof PersonaConfig, value: string) => {
    setPersonas(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const resetPersona = (key: Persona) => {
    setPersonas(prev => ({ ...prev, [key]: DEFAULT_PERSONAS[key] }));
  };

  return (
    <AppStateContext.Provider
      value={{
        language, setLanguage,
        responseLength, setResponseLength,
        maxTurns, setMaxTurns,
        japanModel, setJapanModel,
        globalModel, setGlobalModel,
        reportContext, setReportContext,
        additionalContext, setAdditionalContext,
        personas, updatePersona, resetPersona
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
