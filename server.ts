/**
 * API proxy server for Claude on Vertex AI.
 * Runs separately from the Vite dev server (default: port 3001).
 * Start with: npm run dev:server
 */
import express from 'express';
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

const app = express();
app.use(express.json({ limit: '4mb' }));

const projectId = process.env.VERTEX_PROJECT_ID ?? '';
const region = process.env.VERTEX_REGION ?? 'global';

if (!projectId) {
  console.warn('[server] VERTEX_PROJECT_ID is not set. Claude (Vertex AI) models will fail.');
}

const vertex = new AnthropicVertex({ projectId, region });

/** POST /api/claude/stream
 * Body: { model, system, messages, temperature }
 * Streams back SSE: `data: {"text":"..."}` and finally `data: [DONE]`
 */
app.post('/api/claude/stream', async (req, res) => {
  const { model, system, messages, temperature } = req.body as {
    model: string;
    system: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    temperature?: number;
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = vertex.messages.stream({
      model,
      max_tokens: 4096,
      system,
      messages,
      temperature: temperature ?? 0.8,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/claude/stream]', message);
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  } finally {
    res.end();
  }
});

const port = Number(process.env.SERVER_PORT ?? 3001);
app.listen(port, () => {
  console.log(`[server] API proxy listening on http://localhost:${port}`);
  console.log(`[server] Vertex project: ${projectId || '(not set)'}, region: ${region}`);
});
