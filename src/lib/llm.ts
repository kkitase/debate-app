import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../constants';

export function getProvider(modelId: string) {
  return MODELS.find(m => m.id === modelId)?.provider ?? 'gemini';
}

/** Stream Claude via the local API proxy server (SSE). */
export async function* streamClaudeViaServer(
  params: {
    model: string;
    system: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    temperature?: number;
  },
  idToken: string | null,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const res = await fetch('/api/claude/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) yield parsed.text;
        } catch (e) {
          if (e instanceof SyntaxError) continue; // partial JSON — skip
          throw e;
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

export type HistoryEntry = { role: 'user' | 'model'; parts: [{ text: string }] };

export async function* generateStream(
  modelId: string,
  history: HistoryEntry[],
  prompt: string,
  systemInstruction: string,
  idToken: string | null,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const provider = getProvider(modelId);

  if (provider === 'claude-vertex') {
    const messages = [
      ...history.map(h => ({
        role: (h.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: h.parts[0].text,
      })),
      { role: 'user' as const, content: prompt },
    ];
    yield* streamClaudeViaServer({ model: modelId, system: systemInstruction, messages }, idToken, signal);
  } else {
    // Gemini
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const stream = await ai.models.generateContentStream({
      model: modelId,
      contents: [
        ...history.map(h => ({ role: h.role as 'user' | 'model', parts: h.parts })),
        { role: 'user', parts: [{ text: prompt }] },
      ],
      config: { systemInstruction, temperature: 0.8 },
    });
    for await (const chunk of stream) {
      yield chunk.text ?? '';
    }
  }
}
