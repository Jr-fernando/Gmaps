import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { requireApiAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import { requestContext } from './middleware/requestContext.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean) : false;

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins || (isProduction ? false : true), credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(requestContext);
app.use('/api', rateLimit);

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api', requireApiAuth, routes);

// Base status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((err, req, res, next) => {
  console.error(JSON.stringify({ level: 'error', event: 'unhandled_request_error', requestId: req.requestId, message: err.message }));
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: 'Erro interno do servidor.', requestId: req.requestId });
});

export default app;
