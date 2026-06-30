/**
 * Local development API server
 * Mirrors the Vercel serverless functions so /api/* routes work with `npm run dev`.
 * This file is ONLY used in local development — never deployed to production.
 *
 * Security: All production security (auth, rate-limiting, body limits) is preserved
 * via the shared withMiddleware() wrapper in api/_lib/middleware.js.
 *
 * Env vars: loaded via `node --env-file=.env` in the npm dev script (no dotenv needed).
 */

import express from 'express';
import { createServer } from 'node:http';

// ── Import each API handler (same files Vercel uses in prod) ─────────────────
import cloudinarySignHandler from './api/cloudinary-sign.js';

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Adapts an express (req, res) pair to the simple Vercel-style req/res
 * the withMiddleware wrapper expects. This is a thin shim — no security
 * is bypassed; it just maps Express objects to the same interface.
 */
function vercelAdapter(handler) {
    return (req, res) => handler(req, res);
}

// ── Register routes ──────────────────────────────────────────────────────────
app.post('/api/cloudinary-sign', vercelAdapter(cloudinarySignHandler));

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.LOCAL_API_PORT || 3001;
createServer(app).listen(PORT, () => {
    console.log(`[dev-api] Local API server running on http://localhost:${PORT}`);
    console.log(`[dev-api] Vite proxy will forward /api/* requests here.`);
});
