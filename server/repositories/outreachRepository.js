import { randomUUID } from 'node:crypto';
import { dbAll, dbGet, dbRun, isSupabaseEnabled, supabase } from '../db.js';
import { parseJson } from '../utils/json.js';

const mapMessage = (row) => row ? ({ ...row, metadata: parseJson(row.metadata, {}) }) : null;

export const outreachRepository = {
  createGeneration: async ({ purpose, promptHash, model, leadIds }) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const row = { id, purpose, prompt_hash: promptHash, model, lead_ids: leadIds, status: 'pending', result: {}, token_usage: {}, created_at: now };
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('ai_generations').insert([row]);
      if (error) throw error;
    } else {
      await dbRun('INSERT INTO ai_generations (id, purpose, prompt_hash, model, lead_ids, status, result, token_usage, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, purpose, promptHash, model, JSON.stringify(leadIds), 'pending', '{}', '{}', now]);
    }
    return id;
  },

  completeGeneration: async (id, result, tokenUsage = {}) => {
    const completedAt = new Date().toISOString();
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('ai_generations').update({ status: 'complete', result, token_usage: tokenUsage, completed_at: completedAt }).eq('id', id);
      if (error) throw error;
    } else {
      await dbRun('UPDATE ai_generations SET status = ?, result = ?, token_usage = ?, completed_at = ? WHERE id = ?', ['complete', JSON.stringify(result), JSON.stringify(tokenUsage), completedAt, id]);
    }
  },

  failGeneration: async (id, errorMessage) => {
    const completedAt = new Date().toISOString();
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('ai_generations').update({ status: 'error', error: String(errorMessage).slice(0, 1000), completed_at: completedAt }).eq('id', id);
      if (error) throw error;
    } else {
      await dbRun('UPDATE ai_generations SET status = ?, error = ?, completed_at = ? WHERE id = ?', ['error', String(errorMessage).slice(0, 1000), completedAt, id]);
    }
  },

  createMessage: async ({ leadId, generationId, channel, recipient, subject, message, provider, metadata = {} }) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const row = { id, lead_id: leadId, generation_id: generationId || null, channel, recipient: recipient || '', subject: subject || '', message, status: 'draft', provider: provider || '', requires_approval: true, metadata, created_at: now, updated_at: now };
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('outreach_messages').insert([row]).select('*').single();
      if (error) throw error;
      return mapMessage(data);
    }
    await dbRun('INSERT INTO outreach_messages (id, lead_id, generation_id, channel, recipient, subject, message, status, provider, requires_approval, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, leadId, generationId || null, channel, recipient || '', subject || '', message, 'draft', provider || '', 1, JSON.stringify(metadata), now, now]);
    return mapMessage(await dbGet('SELECT * FROM outreach_messages WHERE id = ?', [id]));
  },

  listMessages: async ({ status = '', limit = 100 } = {}) => {
    let rows;
    if (isSupabaseEnabled) {
      let query = supabase.from('outreach_messages').select('*, leads(name, segment, city, email, whatsapp, phone, instagram, instagram_link)').order('created_at', { ascending: false }).limit(Math.min(Number(limit) || 100, 200));
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      rows = data || [];
      return rows.map((row) => ({ ...mapMessage(row), lead: row.leads || null, leads: undefined }));
    }
    const params = [];
    let sql = 'SELECT m.*, l.name as lead_name, l.segment as lead_segment, l.city as lead_city, l.email as lead_email, l.whatsapp as lead_whatsapp, l.phone as lead_phone, l.instagram as lead_instagram, l.instagram_link as lead_instagram_link FROM outreach_messages m JOIN leads l ON l.id = m.lead_id';
    if (status) { sql += ' WHERE m.status = ?'; params.push(status); }
    sql += ' ORDER BY m.created_at DESC LIMIT ?'; params.push(Math.min(Number(limit) || 100, 200));
    rows = await dbAll(sql, params);
    return rows.map((row) => ({ ...mapMessage(row), lead: { name: row.lead_name, segment: row.lead_segment, city: row.lead_city, email: row.lead_email, whatsapp: row.lead_whatsapp, phone: row.lead_phone, instagram: row.lead_instagram, instagram_link: row.lead_instagram_link } }));
  },

  getMessage: async (id) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('outreach_messages').select('*, leads(*)').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? { ...mapMessage(data), lead: data.leads, leads: undefined } : null;
    }
    const row = await dbGet('SELECT m.*, l.name as lead_name, l.segment as lead_segment, l.city as lead_city, l.email as lead_email, l.whatsapp as lead_whatsapp, l.phone as lead_phone, l.instagram as lead_instagram, l.instagram_link as lead_instagram_link, l.social_analysis as lead_social_analysis FROM outreach_messages m JOIN leads l ON l.id = m.lead_id WHERE m.id = ?', [id]);
    if (!row) return null;
    return { ...mapMessage(row), lead: { id: row.lead_id, name: row.lead_name, segment: row.lead_segment, city: row.lead_city, email: row.lead_email, whatsapp: row.lead_whatsapp, phone: row.lead_phone, instagram: row.lead_instagram, instagram_link: row.lead_instagram_link, social_analysis: parseJson(row.lead_social_analysis, {}) } };
  },

  updateMessage: async (id, changes) => {
    const allowed = ['subject', 'message', 'status', 'provider', 'external_id', 'sent_at', 'error', 'metadata'];
    const update = Object.fromEntries(Object.entries(changes).filter(([key]) => allowed.includes(key)));
    update.updated_at = new Date().toISOString();
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('outreach_messages').update(update).eq('id', id).select('*').single();
      if (error) throw error;
      return mapMessage(data);
    }
    const keys = Object.keys(update);
    await dbRun(`UPDATE outreach_messages SET ${keys.map((key) => `${key} = ?`).join(', ')} WHERE id = ?`, [...keys.map((key) => key === 'metadata' ? JSON.stringify(update[key]) : update[key]), id]);
    return mapMessage(await dbGet('SELECT * FROM outreach_messages WHERE id = ?', [id]));
  },
};
