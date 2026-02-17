import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Message, Persona, PersonaConfig, DebateStatus, StreamingMessage } from '../types';

interface DebateConfig {
  japanModel: string;
  globalModel: string;
  maxTurns: number;
  language: string;
  responseLength: string;
  reportContext: string;
  additionalContext: string;
  personas: Record<Persona, PersonaConfig>;
}

export function useDebate(config: DebateConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [conclusionStreaming, setConclusionStreaming] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState<string | null>(null);
  const [status, setStatus] = useState<DebateStatus>('idle');
  const [turnCount, setTurnCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };

  const reset = () => {
    setMessages([]);
    setStreamingMessage(null);
    setConclusionStreaming(null);
    setConclusion(null);
    setStatus('idle');
    setTurnCount(0);
    setError(null);
  };

  const start = async () => {
    reset();
    setStatus('debating');

    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { japanModel, globalModel, maxTurns, language, responseLength, reportContext, additionalContext, personas } = config;

    let currentMessages: Message[] = [];

    try {
      for (let i = 0; i < maxTurns; i++) {
        if (signal.aborted) return;

        const isJapanTurn = i % 2 === 0;
        const currentPersonaKey: Persona = isJapanTurn ? 'JAPAN_MARKETER' : 'GLOBAL_LEAD';
        const otherPersonaKey: Persona = isJapanTurn ? 'GLOBAL_LEAD' : 'JAPAN_MARKETER';
        const currentModel = isJapanTurn ? japanModel : globalModel;
        const persona = personas[currentPersonaKey];
        const otherPersona = personas[otherPersonaKey];

        const history = currentMessages.map(m => ({
          role: m.role === currentPersonaKey ? 'model' : 'user',
          parts: [{ text: `${personas[m.role].name}: ${m.content}` }],
        }));

        const prompt =
          i === 0
            ? `Start the debate in ${language}. Your name is ${persona.name}. You are speaking to ${otherPersona.name}.
${reportContext ? `We are reviewing this report/context: "${reportContext}".` : ''}
${additionalContext ? `Additional constraints/context: "${additionalContext}".` : ''}
Open the discussion. ${reportContext ? 'Use the provided report as the basis for the discussion and aim to refine or challenge its assumptions.' : "Explain why the current 'Global-first' strategy is struggling in the Japanese market."}`
            : `Respond to the previous point from ${otherPersona.name} in ${language}. Your name is ${persona.name}.
Address ${otherPersona.name} directly by name. Continue the debate.`;

        // Initialize streaming placeholder
        setStreamingMessage({ role: currentPersonaKey, content: '', model: currentModel });

        const stream = await ai.models.generateContentStream({
          model: currentModel,
          contents: [
            ...history.map(h => ({ role: h.role as 'user' | 'model', parts: h.parts })),
            { role: 'user', parts: [{ text: prompt }] },
          ],
          config: {
            systemInstruction: `${persona.systemInstruction}

IMPORTANT:
- Always respond in ${language}.
- Your name is ${persona.name}.
- The person you are debating is ${otherPersona.name}.
- Address them by name.
- Keep your response length to: ${responseLength}.`,
            temperature: 0.8,
          },
        });

        let fullContent = '';
        for await (const chunk of stream) {
          if (signal.aborted) return;
          fullContent += chunk.text ?? '';
          setStreamingMessage({ role: currentPersonaKey, content: fullContent, model: currentModel });
        }

        if (signal.aborted) return;

        const newMessage: Message = {
          id: crypto.randomUUID(),
          role: currentPersonaKey,
          content: fullContent || 'No response generated.',
          model: currentModel,
          timestamp: new Date(),
        };

        setStreamingMessage(null);
        currentMessages = [...currentMessages, newMessage];
        setMessages([...currentMessages]);
        setTurnCount(i + 1);
      }

      if (signal.aborted) return;

      // Generate Conclusion
      setStatus('concluding');
      setConclusionStreaming('');

      const conclusionPrompt = `Based on the debate above regarding ${reportContext ? 'the provided report' : 'Japan marketing strategy'}, write a final "Executive Summary" in ${language} that ${personas.JAPAN_MARKETER.name} can present to the Global Leadership.
The summary must clearly explain WHY simple translation/subtitling fails in Japan in a way that any global executive can understand.
${reportContext ? 'Specifically, provide concrete recommendations on how to improve the initial report/context we discussed.' : "Focus on the concept of 'Trust as a Currency' in the Japanese market."}
${additionalContext ? `Take into account these constraints: "${additionalContext}".` : ''}`;

      const conclusionStream = await ai.models.generateContentStream({
        model: japanModel,
        contents: [
          ...currentMessages.map(m => ({ role: 'user' as const, parts: [{ text: `${personas[m.role].name}: ${m.content}` }] })),
          { role: 'user', parts: [{ text: conclusionPrompt }] },
        ],
        config: {
          systemInstruction: `You are a strategic consultant helping ${personas.JAPAN_MARKETER.name} bridge the gap with ${personas.GLOBAL_LEAD.name}. Summarize the core arguments into a persuasive, universal business case. Always respond in ${language}.`,
        },
      });

      let conclusionText = '';
      for await (const chunk of conclusionStream) {
        if (signal.aborted) return;
        conclusionText += chunk.text ?? '';
        setConclusionStreaming(conclusionText);
      }

      if (signal.aborted) return;
      setConclusionStreaming(null);
      setConclusion(conclusionText || 'Failed to generate summary.');
      setStatus('done');
    } catch (err: unknown) {
      if (signal.aborted) return;
      const msg = err instanceof Error ? err.message : 'An error occurred during the debate.';
      console.error(err);
      setError(msg);
      setStatus('idle');
    } finally {
      setStreamingMessage(null);
      abortRef.current = null;
    }
  };

  return {
    messages,
    streamingMessage,
    conclusionStreaming,
    conclusion,
    status,
    turnCount,
    error,
    start,
    stop,
    reset,
  };
}
