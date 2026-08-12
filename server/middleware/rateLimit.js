const clients = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export const rateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = clients.get(key);
  const current = !record || now - record.startedAt >= WINDOW_MS
    ? { startedAt: now, count: 1 }
    : { ...record, count: record.count + 1 };

  clients.set(key, current);
  res.setHeader('RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current.count));
  if (current.count > MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000));
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
  }
  return next();
};
