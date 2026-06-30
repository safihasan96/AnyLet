import { auth } from './firebase-admin.js';
import { Redis } from '@upstash/redis';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize Redis if env vars exist, otherwise fallback to null
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Initialize Server-Side DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

const memoryRateBuckets = new Map();

function parseLimit(limit) {
  if (typeof limit === 'number') return limit;
  const match = String(limit || '10kb').trim().toLowerCase().match(/^(\d+)(b|kb|mb)?$/);
  if (!match) return 10 * 1024;
  const value = Number(match[1]);
  const unit = match[2] || 'b';
  if (unit === 'mb') return value * 1024 * 1024;
  if (unit === 'kb') return value * 1024;
  return value;
}

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; frame-src 'self' https://www.google.com/recaptcha/; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com;");
}

async function enforceRateLimit(req, res) {
  const ip = getIp(req);
  const now = Date.now();
  const windowSeconds = 60;
  const maxRequests = 30;

  if (redis) {
    try {
      const key = `rate_limit:${ip}`;
      const [count] = await redis.pipeline()
        .incr(key)
        .expire(key, windowSeconds)
        .exec();
        
      if (count > maxRequests) {
        res.status(429).json({ error: 'Too many requests' });
        return false;
      }
      return true;
    } catch (err) {
      console.error('[RateLimit] Redis error, falling back to memory:', err);
      // Fall through to memory fallback
    }
  }

  // Memory fallback (for local dev or if Redis fails)
  const windowMs = windowSeconds * 1000;
  const bucket = memoryRateBuckets.get(ip) || { count: 0, resetAt: now + windowMs };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  memoryRateBuckets.set(ip, bucket);

  if (bucket.count > maxRequests) {
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }

  return true;
}

// Deeply sanitize strings in JSON body
function sanitizePayload(obj) {
  if (typeof obj === 'string') {
    return purify.sanitize(obj, { ALLOWED_TAGS: [] }); // Strip ALL HTML tags from API payloads
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizePayload(value);
    }
    return sanitized;
  }
  return obj;
}

function enforceBodyLimit(req, res, limit) {
  const maxBytes = parseLimit(limit);
  const rawLength = req.headers['content-length'];

  if (rawLength && Number(rawLength) > maxBytes) {
    res.status(413).json({ error: 'Request body too large' });
    return false;
  }

  if (req.body !== undefined) {
    const size = Buffer.byteLength(
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      'utf8'
    );
    if (size > maxBytes) {
      res.status(413).json({ error: 'Request body too large' });
      return false;
    }
  }

  return true;
}

async function attachAuth(req, res, requireAuth, requireAdmin) {
  if (!requireAuth && !requireAdmin) return true;

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  try {
    req.user = await auth.verifyIdToken(header.slice('Bearer '.length).trim());
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  if (requireAdmin && !req.user.admin && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  return true;
}

export function withMiddleware(handler, options = {}) {
  const {
    methods = ['GET', 'POST'],
    requireAuth = false,
    requireAdmin = false,
    bodyLimit = '10kb',
  } = options;

  return async function wrappedHandler(req, res) {
    // ── CORS Configuration ──
    // Allow anylet.com in production, allow localhost in dev.
    const allowedOrigins = ['https://anylet.com', 'https://www.anylet.com', 'http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', methods.join(', ') + ', OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    setSecurityHeaders(res);

    try {
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));
        return res.status(405).json({ error: 'Method not allowed' });
      }

      if (!(await enforceRateLimit(req, res))) return;
      if (!enforceBodyLimit(req, res, bodyLimit)) return;
      if (!(await attachAuth(req, res, requireAuth, requireAdmin))) return;

      // Anti-XSS Sanitization for POST payloads
      if (req.method === 'POST' && req.body && typeof req.body === 'object') {
        req.body = sanitizePayload(req.body);
      }

      return await handler(req, res);
    } catch (error) {
      console.error('[api] Unhandled error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
