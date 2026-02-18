export type Persona = 'JAPAN_MARKETER' | 'GLOBAL_LEAD';

export type ModelProvider = 'gemini' | 'claude-vertex';

export interface ModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
}

export interface Message {
  id: string;
  role: Persona;
  content: string;
  model: string;
  timestamp: Date;
}

export interface PersonaConfig {
  name: string;
  title: string;
  description: string;
  systemInstruction: string;
  color: string;
  avatar: string;
}

export type DebateStatus = 'idle' | 'debating' | 'concluding' | 'done';

export interface StreamingMessage {
  role: Persona;
  content: string;
  model: string;
}