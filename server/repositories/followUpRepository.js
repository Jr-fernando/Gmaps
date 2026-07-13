import { dbGet, dbRun, dbAll, isSupabaseEnabled, supabase } from '../db.js';

export const followUpRepository = {
  // 1. Obter follow-ups pendentes/agendados
  getPendingFollowUps: async (nowTime) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*, leads(name, phone, whatsapp, status)')
        .eq('status', 'Agendado')
        .lte('scheduled_for', nowTime);
      
      if (error) throw error;

      return (data || []).map(f => ({
        id: f.id,
        lead_id: f.lead_id,
        sequence_day: f.sequence_day,
        message: f.message,
        status: f.status,
        scheduled_for: f.scheduled_for,
        sent_at: f.sent_at,
        lead_name: f.leads?.name,
        phone: f.leads?.phone,
        whatsapp: f.leads?.whatsapp,
        lead_status: f.leads?.status
      }));
    } else {
      return await dbAll(
        `SELECT f.*, l.name as lead_name, l.phone, l.whatsapp, l.status as lead_status 
         FROM follow_ups f
         JOIN leads l ON f.lead_id = l.id
         WHERE f.status = 'Agendado' AND f.scheduled_for <= ?`,
         [nowTime]
      );
    }
  },

  // 2. Atualizar status de envio
  updateFollowUpStatus: async (id, status, sentAt) => {
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('follow_ups').update({ status, sent_at: sentAt }).eq('id', id);
      if (error) throw error;
    } else {
      await dbRun('UPDATE follow_ups SET status = ?, sent_at = ? WHERE id = ?', [status, sentAt, id]);
    }
  },

  // 3. Deletar follow-ups agendados
  deleteScheduledFollowUps: async (leadId) => {
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('follow_ups').delete().eq('lead_id', leadId).eq('status', 'Agendado');
      if (error) throw error;
    } else {
      await dbRun("DELETE FROM follow_ups WHERE lead_id = ? AND status = 'Agendado'", [leadId]);
    }
  },

  // 4. Criar follow-up
  createFollowUp: async (leadId, sequenceDay, message, scheduledFor) => {
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('follow_ups').insert([{
        lead_id: leadId,
        sequence_day: sequenceDay,
        message: message,
        status: 'Agendado',
        scheduled_for: scheduledFor
      }]);
      if (error) throw error;
    } else {
      await dbRun(
        `INSERT INTO follow_ups (lead_id, sequence_day, message, status, scheduled_for) 
         VALUES (?, ?, ?, 'Agendado', ?)`,
        [leadId, sequenceDay, message, scheduledFor]
      );
    }
  }
};
