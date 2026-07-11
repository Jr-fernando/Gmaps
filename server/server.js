import dotenv from 'dotenv';
import app from './app.js';
import { initDb } from './db.js';
import { startScheduler } from './services/cronService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

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
