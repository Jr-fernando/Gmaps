import { createClient } from '@supabase/supabase-js';
import { dbGet, dbRun, dbAll } from '../db.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const isSupabaseEnabled = supabaseUrl !== '' && supabaseKey !== '';

let supabase = null;
if (isSupabaseEnabled) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const settingsRepository = {
  // 1. Obter todas as configurações
  getSettings: async () => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error) throw error;
      const settingsObj = {};
      (data || []).forEach(r => {
        settingsObj[r.key] = r.value;
      });
      return settingsObj;
    } else {
      const rows = await dbAll('SELECT key, value FROM settings');
      const settingsObj = {};
      rows.forEach(r => {
        settingsObj[r.key] = r.value;
      });
      return settingsObj;
    }
  },

  // 2. Obter configuração única
  getSettingByKey: async (key) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
      if (error) return '';
      return data ? data.value : '';
    } else {
      const setting = await dbGet('SELECT value FROM settings WHERE key = ?', [key]);
      return setting ? setting.value : '';
    }
  },

  // 3. Salvar configurações
  saveSettings: async (settingsObj) => {
    if (isSupabaseEnabled) {
      const insertRows = Object.entries(settingsObj).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString()
      }));

      for (const row of insertRows) {
        const { error } = await supabase.from('settings').upsert([row]);
        if (error) throw error;
      }
    } else {
      for (const [key, value] of Object.entries(settingsObj)) {
        await dbRun(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, String(value)]
        );
      }
    }
  }
};
