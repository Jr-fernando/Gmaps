import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { requireApiAuth } from './middleware/auth.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '256kb' }));

// Main API Routes
app.use('/api', requireApiAuth, routes);

// Base status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default app;
