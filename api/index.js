import app from '../server/app.js';
import { initDb } from '../server/db.js';

// Initialize db (primarily SQLite schema or Supabase client verification)
try {
  await initDb();
} catch (err) {
  console.error('[Vercel Serverless] Error initializing DB:', err.message);
}

export default app;
