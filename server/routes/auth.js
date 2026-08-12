import crypto from 'node:crypto';
import express from 'express';

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const parseCookies = (header = '') => Object.fromEntries(
  header.split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key)
);

const sessionCookie = (value, maxAge) => [
  `agentic_session=${encodeURIComponent(value)}`,
  'Path=/',
  'HttpOnly',
  'SameSite=Strict',
  isProduction ? 'Secure' : '',
  `Max-Age=${maxAge}`
].filter(Boolean).join('; ');

router.post('/login', (req, res) => {
  const configuredToken = process.env.ADMIN_API_KEY;
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!configuredToken) return res.status(503).json({ error: 'Autenticação não configurada.' });
  const expected = Buffer.from(configuredToken);
  const received = Buffer.from(password);
  if (!password || password.length > 512 || received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(401).json({ error: 'Credencial inválida.' });
  }
  res.setHeader('Set-Cookie', sessionCookie(configuredToken, 60 * 60 * 8));
  return res.json({ success: true });
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  res.status(204).end();
});

router.get('/session', (req, res) => {
  const configuredToken = process.env.ADMIN_API_KEY;
  const session = parseCookies(req.headers.cookie).agentic_session;
  res.json({ authenticated: !configuredToken || session === configuredToken });
});

export const getSessionToken = (req) => parseCookies(req.headers.cookie).agentic_session || '';
export default router;
