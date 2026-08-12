import crypto from 'node:crypto';

export const requestContext = (req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  const startedAt = performance.now();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startedAt);
    console.info(JSON.stringify({
      level: 'info',
      event: 'http_request',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs
    }));
  });
  next();
};
