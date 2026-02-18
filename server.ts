/**
 * API proxy server for Claude on Vertex AI.
 * Runs separately from the Vite dev server (default: port 3001).
 * Start with: npm run dev:server
 */
import { config } from 'dotenv';
config({ path: '.env.local' }); // load before any process.env access

import express, { Request, Response, NextFunction } from 'express';
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VERTEX_PROJECT_ID ?? '';
const vertexProjectId = process.env.VERTEX_PROJECT_ID ?? '';
const region = process.env.VERTEX_REGION ?? 'us-east5';

// Initialize Firebase Admin
// On Cloud Run, it will automatically use the default service account.
// Locally, you might need GOOGLE_APPLICATION_CREDENTIALS points to a service account key.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseProjectId
  });
}

const db = getFirestore();

const app = express();
app.use(express.json({ limit: '4mb' }));

if (!vertexProjectId) {
  console.warn('[server] VERTEX_PROJECT_ID is not set. Claude (Vertex AI) models will fail.');
}

const vertex = new AnthropicVertex({ projectId: vertexProjectId, region });

/**
 * Middleware to verify Firebase ID Token
 */
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      return res.status(403).json({ error: 'Forbidden: Email required' });
    }

    // Double check whitelist in backend for safety
    const userDoc = await db.collection('allowed_users').doc(email).get();
    if (!userDoc.exists) {
      console.error('[auth] Backend: User not in whitelist:', email);
      return res.status(403).json({ error: 'Forbidden: User not in whitelist' });
    }

    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('[auth] Error verifying token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/** POST /api/claude/stream
 * Body: { model, system, messages, temperature }
 * Streams back SSE: `data: {"text":"..."}` and finally `data: [DONE]`
 */
app.post('/api/claude/stream', authenticate, async (req, res) => {
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

// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// For any other request, send the index.html (supporting client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = Number(process.env.PORT ?? process.env.SERVER_PORT ?? 3001);
app.listen(port, () => {
  console.log(`[server] API proxy listening on http://localhost:${port}`);
  console.log(`[server] Vertex project: ${vertexProjectId || '(not set)'}, region: ${region}`);
});
