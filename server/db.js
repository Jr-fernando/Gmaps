import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
  } else {
    console.log('Conectado com sucesso ao banco de dados SQLite.');
  }
});

// Helper functions using Promises
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Initialize schema
export const initDb = async () => {
  console.log('Inicializando tabelas do banco de dados...');
  
  // Leads table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      segment TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      website TEXT,
      instagram TEXT,
      facebook TEXT,
      city TEXT,
      state TEXT,
      address TEXT,
      rating REAL,
      reviews_count INTEGER,
      followers INTEGER,
      description TEXT,
      category TEXT,
      gmaps_link TEXT,
      instagram_link TEXT,
      status TEXT DEFAULT 'Novo Lead',
      opportunity_score INTEGER DEFAULT 0,
      has_website INTEGER DEFAULT 0,
      website_analysis TEXT, -- Store JSON
      social_analysis TEXT,  -- Store JSON
      ai_report TEXT,
      first_message TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  // Follow-ups table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      sequence_day INTEGER,
      message TEXT,
      status TEXT DEFAULT 'Agendado',
      scheduled_for TEXT,
      sent_at TEXT,
      FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  // Settings table (key-value storage)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Insert default settings if they don't exist
  const defaultSettings = [
    { key: 'gemini_api_key', value: '' },
    { key: 'openai_api_key', value: '' },
    { key: 'claude_api_key', value: '' },
    { key: 'google_places_api_key', value: '' },
    { key: 'whatsapp_webhook_url', value: '' },
    { key: 'telegram_webhook_url', value: '' },
    { key: 'notion_api_key', value: '' },
    { key: 'notion_database_id', value: '' },
    { key: 'google_sheets_url', value: '' },
    { key: 'follow_up_day_2', value: 'Olá [Nome], tudo bem? Lembra da nossa conversa sobre as melhorias na presença digital da [Empresa]? Queria saber se teve tempo de dar uma olhada no relatório gratuito que preparei. Fico à disposição!' },
    { key: 'follow_up_day_5', value: 'Oi [Nome], espero que esteja tendo uma boa semana. Só passando para saber se você viu a mensagem anterior. Com um site moderno e as automações certas, a [Empresa] conseguiria converter bem mais clientes da região. Podemos marcar um bate-papo de 10 minutos?' },
    { key: 'follow_up_day_10', value: 'Olá [Nome], tudo bem? Para não tomar muito seu tempo, este será meu último contato por aqui. Se em algum momento você quiser estruturar um site moderno, identidade visual ou chatbots inteligentes de WhatsApp para a [Empresa], basta me chamar. Sucesso nos negócios!' }
  ];

  for (const setting of defaultSettings) {
    await dbRun(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      [setting.key, setting.value]
    );
  }

  console.log('Tabelas inicializadas com sucesso.');
};

export default db;
