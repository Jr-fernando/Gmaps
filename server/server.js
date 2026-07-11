import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import routes from './routes.js';
import { startScheduler } from './services/cronService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main API Routes
app.use('/api', routes);

// Base status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start Server and Database
const startServer = async () => {
  try {
    // Initialize SQLite Database
    await initDb();
    
    // Start Server Listener
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`   AgenticLeads API Server is running on port ${PORT} `);
      console.log(`   Environment: development`);
      console.log(`==================================================`);
    });

    // Start background follow-up scheduler
    startScheduler();

  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err.message);
    process.exit(1);
  }
};

startServer();
