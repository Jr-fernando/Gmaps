import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import dashboardRoutes from './routes/dashboard.js';
import searchRoutes from './routes/search.js';
import companiesRoutes from './routes/companies.js';
import analysisRoutes from './routes/analysis.js';
import crmRoutes from './routes/crm.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/crm', crmRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 AgenticLeads Server running at http://localhost:${PORT}\n`);
});
