import { createClient } from '@supabase/supabase-js';
import { dbGet, dbRun, dbAll } from '../db.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const isSupabaseEnabled = supabaseUrl !== '' && supabaseKey !== '';

let supabase = null;
if (isSupabaseEnabled) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const leadRepository = {
  isSupabase: () => isSupabaseEnabled,
  getSupabaseClient: () => supabase,

  // 1. Obter estatísticas do painel
  getStats: async () => {
    if (isSupabaseEnabled) {
      const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const todayStr = new Date().toISOString().slice(0, 10);
      
      const { count: newLeadsToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .or(`created_at.gte.${todayStr}T00:00:00Z,status.eq.Novo Lead`);

      const { count: messagesSent } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Novo Lead","Entrar em contato")');

      const { count: replies } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Respondeu', 'Negociação', 'Proposta enviada', 'Cliente']);

      const { count: closed } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Cliente');

      const { count: lost } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Perdido');

      const { data: segmentData } = await supabase.from('leads').select('segment');
      
      const segmentCounts = {};
      if (segmentData) {
        segmentData.forEach(r => {
          const seg = r.segment || 'Geral';
          segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
        });
      }
      
      const segmentsRank = Object.entries(segmentCounts)
        .map(([segment, count]) => ({ segment, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalLeads: totalLeads || 0,
        newLeads: newLeadsToday || 0,
        messagesSent: messagesSent || 0,
        replies: replies || 0,
        closed: closed || 0,
        lost: lost || 0,
        segmentsRank
      };
    } else {
      const totalLeads = await dbGet('SELECT COUNT(*) as count FROM leads');
      const newLeads = await dbGet("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now') OR status = 'Novo Lead'");
      const messagesSent = await dbGet("SELECT COUNT(*) as count FROM leads WHERE status NOT IN ('Novo Lead', 'Entrar em contato')");
      const replies = await dbGet("SELECT COUNT(*) as count FROM leads WHERE status IN ('Respondeu', 'Negociação', 'Proposta enviada', 'Cliente')");
      const closed = await dbGet("SELECT COUNT(*) as count FROM leads WHERE status = 'Cliente'");
      const lost = await dbGet("SELECT COUNT(*) as count FROM leads WHERE status = 'Perdido'");
      
      const segments = await dbAll(
        `SELECT segment, COUNT(*) as count 
         FROM leads 
         GROUP BY segment 
         ORDER BY count DESC 
         LIMIT 5`
      );

      return {
        totalLeads: totalLeads.count,
        newLeads: newLeads.count,
        messagesSent: messagesSent.count,
        replies: replies.count,
        closed: closed.count,
        lost: lost.count,
        segmentsRank: segments
      };
    }
  },

  // 2. Filtrar leads
  searchLeads: async (filters = {}) => {
    const { 
      city, state, segment, status, has_website, min_score, query,
      instagram, facebook, whatsapp, phone, min_rating, min_reviews
    } = filters;

    if (isSupabaseEnabled) {
      let q = supabase.from('leads').select('*');
      if (city) q = q.ilike('city', `%${city}%`);
      if (state) q = q.ilike('state', `%${state}%`);
      if (segment) q = q.ilike('segment', `%${segment}%`);
      if (status) q = q.eq('status', status);
      if (has_website !== undefined && has_website !== '') q = q.eq('has_website', parseInt(has_website));
      if (min_score) q = q.gte('opportunity_score', parseInt(min_score));
      if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      
      if (instagram === '1') q = q.not('instagram', 'is', null).neq('instagram', '');
      else if (instagram === '0') q = q.or('instagram.is.null,instagram.eq.""');

      if (facebook === '1') q = q.not('facebook', 'is', null).neq('facebook', '');
      else if (facebook === '0') q = q.or('facebook.is.null,facebook.eq.""');

      if (whatsapp === '1') q = q.not('whatsapp', 'is', null).neq('whatsapp', '');
      else if (whatsapp === '0') q = q.or('whatsapp.is.null,whatsapp.eq.""');

      if (phone === '1') q = q.not('phone', 'is', null).neq('phone', '');
      else if (phone === '0') q = q.or('phone.is.null,phone.eq.""');

      if (min_rating) q = q.gte('rating', parseFloat(min_rating));
      if (min_reviews) q = q.gte('reviews_count', parseInt(min_reviews));
      
      const { data, error } = await q.order('opportunity_score', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      let sql = 'SELECT * FROM leads WHERE 1=1';
      const params = [];

      if (city) {
        sql += ' AND city LIKE ?';
        params.push(`%${city}%`);
      }
      if (state) {
        sql += ' AND state LIKE ?';
        params.push(`%${state}%`);
      }
      if (segment) {
        sql += ' AND segment LIKE ?';
        params.push(`%${segment}%`);
      }
      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (has_website !== undefined && has_website !== '') {
        sql += ' AND has_website = ?';
        params.push(parseInt(has_website));
      }
      if (min_score) {
        sql += ' AND opportunity_score >= ?';
        params.push(parseInt(min_score));
      }
      if (query) {
        sql += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      if (instagram === '1') {
        sql += " AND instagram IS NOT NULL AND instagram != ''";
      } else if (instagram === '0') {
        sql += " AND (instagram IS NULL OR instagram = '')";
      }

      if (facebook === '1') {
        sql += " AND facebook IS NOT NULL AND facebook != ''";
      } else if (facebook === '0') {
        sql += " AND (facebook IS NULL OR facebook = '')";
      }

      if (whatsapp === '1') {
        sql += " AND whatsapp IS NOT NULL AND whatsapp != ''";
      } else if (whatsapp === '0') {
        sql += " AND (whatsapp IS NULL OR whatsapp = '')";
      }

      if (phone === '1') {
        sql += " AND phone IS NOT NULL AND phone != ''";
      } else if (phone === '0') {
        sql += " AND (phone IS NULL OR phone = '')";
      }

      if (min_rating) {
        sql += ' AND rating >= ?';
        params.push(parseFloat(min_rating));
      }
      if (min_reviews) {
        sql += ' AND reviews_count >= ?';
        params.push(parseInt(min_reviews));
      }

      sql += ' ORDER BY opportunity_score DESC, id DESC';
      return await dbAll(sql, params);
    }
  },

  // 3. Obter lead por ID com follow-ups
  getLeadById: async (id) => {
    if (isSupabaseEnabled) {
      const { data: lead, error } = await supabase.from('leads').select('*').eq('id', id).single();
      if (error) return null;

      const { data: followUps } = await supabase.from('follow_ups').select('*').eq('lead_id', id).order('sequence_day', { ascending: true });
      
      return {
        ...lead,
        website_analysis: typeof lead.website_analysis === 'string' ? JSON.parse(lead.website_analysis) : lead.website_analysis || {},
        social_analysis: typeof lead.social_analysis === 'string' ? JSON.parse(lead.social_analysis) : lead.social_analysis || {},
        reviews: typeof lead.reviews === 'string' ? JSON.parse(lead.reviews) : lead.reviews || [],
        gallery: typeof lead.gallery === 'string' ? JSON.parse(lead.gallery) : lead.gallery || [],
        history: typeof lead.history === 'string' ? JSON.parse(lead.history) : lead.history || [],
        followUps: followUps || []
      };
    } else {
      const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
      if (!lead) return null;

      const followUps = await dbAll(
        "SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY sequence_day ASC", 
        [id]
      );

      return {
        ...lead,
        website_analysis: JSON.parse(lead.website_analysis || '{}'),
        social_analysis: JSON.parse(lead.social_analysis || '{}'),
        reviews: JSON.parse(lead.reviews || '[]'),
        gallery: JSON.parse(lead.gallery || '[]'),
        history: JSON.parse(lead.history || '[]'),
        followUps
      };
    }
  },

  // 4. Buscar lead existente
  findLeadByNameAndCity: async (name, city) => {
    if (isSupabaseEnabled) {
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq('name', name)
        .eq('city', city)
        .maybeSingle();
      return data;
    } else {
      return await dbGet(
        "SELECT id FROM leads WHERE name = ? AND city = ?",
        [name, city]
      );
    }
  },

  // 5. Criar lead
  createLead: async (leadData) => {
    const now = new Date().toISOString();
    const insertData = {
      name: leadData.name,
      segment: leadData.segment,
      category: leadData.category,
      phone: leadData.phone,
      whatsapp: leadData.whatsapp,
      email: leadData.email,
      website: leadData.website,
      instagram: leadData.instagram,
      facebook: leadData.facebook,
      city: leadData.city,
      state: leadData.state,
      address: leadData.address,
      rating: leadData.rating,
      reviews_count: leadData.reviews_count,
      followers: leadData.followers,
      description: leadData.description,
      gmaps_link: leadData.gmaps_link,
      latitude: leadData.latitude,
      longitude: leadData.longitude,
      status: leadData.status || 'Novo Lead',
      opportunity_score: leadData.opportunity_score || 0,
      has_website: leadData.has_website || 0,
      website_analysis: leadData.website_analysis,
      social_analysis: leadData.social_analysis,
      ai_report: leadData.ai_report,
      first_message: leadData.first_message,
      owner: leadData.owner || '',
      value_negotiated: leadData.value_negotiated || 0,
      next_action: leadData.next_action || '',
      notes: leadData.notes || '',
      schedule: leadData.schedule || '',
      reviews: leadData.reviews || [],
      gallery: leadData.gallery || [],
      first_contact_date: leadData.first_contact_date || '',
      last_contact_date: leadData.last_contact_date || '',
      history: leadData.history || [],
      proposal_text: leadData.proposal_text || '',
      proposal_sent: leadData.proposal_sent ? 1 : 0,
      labels: leadData.labels || '[]',
      probability: leadData.probability || 50,
      next_contact_date: leadData.next_contact_date || '',
      updated_at: now
    };

    if (isSupabaseEnabled) {
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...insertData, created_at: now }])
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    } else {
      const result = await dbRun(
        `INSERT INTO leads (
          name, segment, category, phone, whatsapp, email, website, instagram, facebook,
          city, state, address, rating, reviews_count, followers, description,
          gmaps_link, latitude, longitude, status, opportunity_score,
          has_website, website_analysis, social_analysis, ai_report, first_message,
          owner, value_negotiated, next_action, notes,
          schedule, reviews, gallery, first_contact_date, last_contact_date, history,
          proposal_text, proposal_sent, labels, probability, next_contact_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          insertData.name, insertData.segment, insertData.category, insertData.phone, insertData.whatsapp,
          insertData.email, insertData.website, insertData.instagram, insertData.facebook, insertData.city,
          insertData.state, insertData.address, insertData.rating, insertData.reviews_count, insertData.followers,
          insertData.description, insertData.gmaps_link, insertData.latitude, insertData.longitude, insertData.status,
          insertData.opportunity_score, insertData.has_website,
          typeof insertData.website_analysis === 'object' ? JSON.stringify(insertData.website_analysis) : insertData.website_analysis,
          typeof insertData.social_analysis === 'object' ? JSON.stringify(insertData.social_analysis) : insertData.social_analysis,
          insertData.ai_report, insertData.first_message, insertData.owner, insertData.value_negotiated,
          insertData.next_action, insertData.notes,
          insertData.schedule,
          typeof insertData.reviews === 'object' ? JSON.stringify(insertData.reviews) : insertData.reviews,
          typeof insertData.gallery === 'object' ? JSON.stringify(insertData.gallery) : insertData.gallery,
          insertData.first_contact_date, insertData.last_contact_date,
          typeof insertData.history === 'object' ? JSON.stringify(insertData.history) : insertData.history,
          insertData.proposal_text, insertData.proposal_sent,
          typeof insertData.labels === 'object' ? JSON.stringify(insertData.labels) : insertData.labels,
          insertData.probability, insertData.next_contact_date,
          now, now
        ]
      );
      return result.id;
    }
  },

  // 6. Atualizar status do CRM
  updateLeadStatus: async (id, status) => {
    const now = new Date().toISOString();
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('leads').update({ status, updated_at: now }).eq('id', id);
      if (error) throw error;
    } else {
      await dbRun('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
    }
  },

  // 7. Atualizar dados completos do CRM
  updateLeadCrm: async (id, crmData) => {
    const now = new Date().toISOString();
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('leads').update({
        owner: crmData.owner,
        value_negotiated: parseFloat(crmData.value_negotiated || 0),
        next_action: crmData.next_action,
        notes: crmData.notes,
        status: crmData.status,
        first_contact_date: crmData.first_contact_date,
        last_contact_date: crmData.last_contact_date,
        history: typeof crmData.history === 'object' ? crmData.history : JSON.parse(crmData.history || '[]'),
        proposal_text: crmData.proposal_text,
        proposal_sent: crmData.proposal_sent ? true : false,
        labels: typeof crmData.labels === 'object' ? crmData.labels : JSON.parse(crmData.labels || '[]'),
        probability: parseInt(crmData.probability || 50),
        next_contact_date: crmData.next_contact_date,
        updated_at: now
      }).eq('id', id);
      if (error) throw error;
    } else {
      await dbRun(
        `UPDATE leads SET owner = ?, value_negotiated = ?, next_action = ?, notes = ?, status = ?, first_contact_date = ?, last_contact_date = ?, history = ?, proposal_text = ?, proposal_sent = ?, labels = ?, probability = ?, next_contact_date = ?, updated_at = ? WHERE id = ?`,
        [
          crmData.owner,
          parseFloat(crmData.value_negotiated || 0),
          crmData.next_action,
          crmData.notes,
          crmData.status,
          crmData.first_contact_date,
          crmData.last_contact_date,
          typeof crmData.history === 'object' ? JSON.stringify(crmData.history) : crmData.history || '[]',
          crmData.proposal_text,
          crmData.proposal_sent ? 1 : 0,
          typeof crmData.labels === 'object' ? JSON.stringify(crmData.labels) : crmData.labels || '[]',
          parseInt(crmData.probability || 50),
          crmData.next_contact_date,
          now,
          id
        ]
      );
    }
  },

  // 8. Atualizar relatório de IA e primeira mensagem
  updateLeadAi: async (id, firstMessage, aiReport) => {
    const now = new Date().toISOString();
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('leads').update({
        first_message: firstMessage,
        ai_report: aiReport,
        updated_at: now
      }).eq('id', id);
      if (error) throw error;
    } else {
      await dbRun(
        'UPDATE leads SET first_message = ?, ai_report = ?, updated_at = ? WHERE id = ?',
        [firstMessage, aiReport, now, id]
      );
    }
  },

  // 9. Deletar Lead
  deleteLead: async (id) => {
    if (isSupabaseEnabled) {
      await supabase.from('follow_ups').delete().eq('lead_id', id);
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    } else {
      await dbRun('DELETE FROM leads WHERE id = ?', [id]);
      await dbRun('DELETE FROM follow_ups WHERE lead_id = ?', [id]);
    }
  }
};
