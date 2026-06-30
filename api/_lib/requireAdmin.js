import { auth } from './firebase-admin.js';

export async function requireAdmin(req, res) {
  const decoded = await requireAuth(req, res);
  if (!decoded) return null;

  if (!decoded.admin && decoded.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin access required' });
    return null;
  }

  return decoded;
}

export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return null;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  try {
    return await auth.verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}
