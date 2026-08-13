import { dbGet, dbRun, dbAll, isSupabaseEnabled, supabase } from '../db.js';

const secretKeys = new Set(['gemini_api_key', 'openai_api_key', 'claude_api_key', 'google_places_api_key', 'resend_api_key', 'meta_access_token']);
const environmentSecrets = {
  gemini_api_key: 'GEMINI_API_KEY',
  openai_api_key: 'OPENAI_API_KEY',
  google_places_api_key: 'GOOGLE_PLACES_API_KEY',
  resend_api_key: 'RESEND_API_KEY',
  meta_access_token: 'META_ACCESS_TOKEN',
  email_from: 'EMAIL_FROM',
  whatsapp_phone_number_id: 'WHATSAPP_PHONE_NUMBER_ID',
  instagram_account_id: 'INSTAGRAM_ACCOUNT_ID'
};

const mergeEnvironmentSecrets = (settings) => {
  const merged = { ...settings };
  for (const [settingKey, environmentKey] of Object.entries(environmentSecrets)) {
    if (process.env[environmentKey]) merged[settingKey] = process.env[environmentKey];
  }
  return merged;
};

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
      return mergeEnvironmentSecrets(settingsObj);
    } else {
      const rows = await dbAll('SELECT key, value FROM settings');
      const settingsObj = {};
      rows.forEach(r => {
        settingsObj[r.key] = r.value;
      });
      return mergeEnvironmentSecrets(settingsObj);
    }
  },

  getPublicSettings: async () => {
    const settings = await settingsRepository.getSettings();
    const publicSettings = { ...settings };
    for (const key of secretKeys) {
      publicSettings[key] = '';
      publicSettings[`${key}_configured`] = Boolean(settings[key]);
    }
    return publicSettings;
  },

  // 2. Obter configuração única
  getSettingByKey: async (key) => {
    const environmentKey = environmentSecrets[key];
    if (environmentKey && process.env[environmentKey]) return process.env[environmentKey];
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
      const insertRows = Object.entries(settingsObj)
        .filter(([key, value]) => !(secretKeys.has(key) && !String(value || '').trim()))
        .map(([key, value]) => ({
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
        if (secretKeys.has(key) && !String(value || '').trim()) continue;
        await dbRun(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, String(value)]
        );
      }
    }
  }
};
