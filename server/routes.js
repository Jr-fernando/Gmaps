import express from 'express';
import { dbService } from './services/dbService.js';
import { searchCompanies } from './services/scraperService.js';
import { analyzePresence } from './services/presenceService.js';
import { qualifyLead, sortQualifiedLeads } from './services/qualificationService.js';
import { generateAiReport, generateProposalText, chatWithLeadAi } from './services/aiService.js';
import { processPendingFollowUps } from './services/cronService.js';
import { validateLeadSearch, validateCrmUpdate, validateLeadId, validateMessage } from './validators/validator.js';
import { dispatchWebhookEvent } from './services/webhookService.js';
import { isSafeExternalUrl } from './utils/validation.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await dbService.settings.getSettings();
    res.json({ status: 'healthy', database: dbService.isSupabase() ? 'supabase' : 'sqlite', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Healthcheck Error]:', err.message);
    res.status(503).json({ status: 'unhealthy' });
  }
});

// Helper to schedule follow-ups
async function scheduleFollowUpsForLead(leadId, companyName, contactName) {
  // Clear any existing scheduled follow-ups first
  await dbService.followUps.deleteScheduledFollowUps(leadId);

  // Load templates
  const templates = await dbService.settings.getSettings();

  const namePlaceholder = contactName || 'parceiro';
  const replaceTags = (text) => {
    if (!text) return '';
    return text
      .replace(/\[Nome\]/g, namePlaceholder)
      .replace(/\[Empresa\]/g, companyName);
  };

  const now = new Date();
  
  // Schedule Day 2, 5, and 10
  const intervals = [
    { day: 2, key: 'follow_up_day_2', daysToAdd: 2 },
    { day: 5, key: 'follow_up_day_5', daysToAdd: 5 },
    { day: 10, key: 'follow_up_day_10', daysToAdd: 10 }
  ];

  for (const interval of intervals) {
    const scheduledTime = new Date(now);
    const isFastMode = templates['fast_follow_up_mode'] === 'true';
    
    if (isFastMode) {
      // Fast mode: Schedule in minutes instead of days
      scheduledTime.setMinutes(now.getMinutes() + interval.daysToAdd);
    } else {
      scheduledTime.setDate(now.getDate() + interval.daysToAdd);
    }

    const message = replaceTags(templates[interval.key] || '');

    await dbService.followUps.createFollowUp(
      leadId,
      interval.day,
      message,
      scheduledTime.toISOString()
    );
  }
}

// 1. Dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await dbService.leads.getStats();
    
    const conversionRate = stats.totalLeads > 0 
      ? parseFloat(((stats.closed / stats.totalLeads) * 100).toFixed(1)) 
      : 0;
    
    const responseRate = stats.messagesSent > 0 
      ? parseFloat(((stats.replies / stats.messagesSent) * 100).toFixed(1)) 
      : 0;

    res.json({
      ...stats,
      responseRate,
      conversionRate,
      valueSold: stats.valueSold || 0,
    });
  } catch (err) {
    console.error('[API Stats Error]:', err.message);
    res.status(500).json({ error: 'Erro ao processar estatísticas do painel.' });
  }
});

// 2. Leads search triggering
router.post('/leads/search', validateLeadSearch, async (req, res) => {
  const { query, city, ...criteria } = req.body;
  
  try {
    console.log(`[API] Iniciando busca ativa para segmento '${query}' em '${city}'...`);
    const leads = await searchCompanies(query, city, criteria);

    const qualified = sortQualifiedLeads(leads.map((lead) => qualifyLead(lead, criteria.need)), criteria.sortMode);
    const existingLeads = await dbService.leads.findLeadsByNamesAndCity(qualified.map((lead) => lead.name), city);
    const existingByName = new Map(existingLeads.map((lead) => [lead.name, lead]));
    const savedLeads = [];
    let newCount = 0;

    // Small batches keep Supabase responsive without creating a long sequential waterfall.
    for (let index = 0; index < qualified.length; index += 8) {
      const batch = qualified.slice(index, index + 8);
      const savedBatch = await Promise.all(batch.map(async (lead) => {
        const existing = existingByName.get(lead.name);
        if (existing) {
          const qualification = lead.website_analysis?.qualification;
          return {
            ...existing,
            website_analysis: { ...(existing.website_analysis || {}), qualification },
            social_analysis: { ...(existing.social_analysis || {}), qualification },
          };
        }
        try {
          const id = await dbService.leads.createLead(lead);
          newCount += 1;
          const saved = { ...lead, id };
          dispatchWebhookEvent('NEW_LEAD', saved);
          return saved;
        } catch (error) {
          console.error(`[API] Erro ao cadastrar lead individual '${lead.name}':`, error.message);
          return null;
        }
      }));
      savedLeads.push(...savedBatch.filter(Boolean));
    }

    const ordered = sortQualifiedLeads(savedLeads, criteria.sortMode).slice(0, criteria.limit);
    res.json({
      message: `Busca finalizada. ${ordered.length} leads entregues e ${newCount} adicionados ao CRM.`,
      leads: ordered,
      requested: criteria.limit,
      found: ordered.length,
      newCount,
      shortfall: Math.max(criteria.limit - ordered.length, 0),
    });
  } catch (err) {
    console.error('[API Error] Falha na busca de leads:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Leads listing with filters
router.get('/leads', async (req, res) => {
  try {
    const filters = {
      city: req.query.city,
      state: req.query.state,
      segment: req.query.segment,
      status: req.query.status,
      has_website: req.query.has_website,
      min_score: req.query.min_score,
      query: req.query.query,
      instagram: req.query.instagram,
      facebook: req.query.facebook,
      whatsapp: req.query.whatsapp,
      phone: req.query.phone,
      min_rating: req.query.min_rating,
      min_reviews: req.query.min_reviews
    };

    const leads = await dbService.leads.searchLeads(filters);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Lead details
router.get('/leads/:id', validateLeadId, async (req, res) => {
  try {
    const lead = await dbService.leads.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update lead status
router.put('/leads/:id/status', validateLeadId, validateCrmUpdate, async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status é obrigatório' });
  }

  try {
    await dbService.leads.updateLeadStatus(req.params.id, status);
    const updated = await dbService.leads.getLeadById(req.params.id);
    
    // Dispatch webhook event
    dispatchWebhookEvent('STATUS_CHANGED', updated);

    res.json({ success: true, message: 'Status atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Update complete CRM lead details
router.put('/leads/:id/crm', validateLeadId, validateCrmUpdate, async (req, res) => {
  const { 
    owner, value_negotiated, next_action, notes, status,
    first_contact_date, last_contact_date, history, proposal_text, proposal_sent,
    labels, probability, next_contact_date: nextContactDate
  } = req.body;

  try {
    await dbService.leads.updateLeadCrm(req.params.id, {
      owner,
      value_negotiated,
      next_action,
      notes,
      status,
      first_contact_date,
      last_contact_date,
      history,
      proposal_text,
      proposal_sent,
      labels,
      probability,
      next_contact_date: nextContactDate
    });

    const updated = await dbService.leads.getLeadById(req.params.id);
    
    // Dispatch Webhook status changed event
    dispatchWebhookEvent('STATUS_CHANGED', updated);

    res.json({ success: true, message: 'Dados do CRM atualizados com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete a lead
router.delete('/leads/:id', validateLeadId, async (req, res) => {
  try {
    await dbService.leads.deleteLead(req.params.id);
    res.json({ success: true, message: 'Lead deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Regenerate prospecting message
router.post('/leads/:id/generate-message', validateLeadId, async (req, res) => {
  try {
    const lead = await dbService.leads.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const result = await generateAiReport(lead, lead.website_analysis, lead.social_analysis);

    await dbService.leads.updateLeadAi(req.params.id, result.firstMessage, result.aiReport);

    res.json({ first_message: result.firstMessage, ai_report: result.aiReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Generate proposal
router.post('/leads/:id/proposal', validateLeadId, async (req, res) => {
  const { services } = req.body;
  if (!services || !Array.isArray(services)) {
    return res.status(400).json({ error: 'Lista de serviços é obrigatória' });
  }

  try {
    const lead = await dbService.leads.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const proposalMarkdown = await generateProposalText(lead, services);
    
    // Save to CRM database
    const now = new Date().toISOString();
    const historyEntry = {
      date: now,
      type: 'proposal_sent',
      description: `Proposta gerada para serviços: ${services.join(', ')}`
    };
    const updatedHistory = Array.isArray(lead.history) ? [...lead.history, historyEntry] : [historyEntry];

    await dbService.leads.updateLeadCrm(req.params.id, {
      owner: lead.owner || '',
      value_negotiated: lead.value_negotiated || 0,
      next_action: lead.next_action || '',
      notes: lead.notes || '',
      status: 'Proposta enviada',
      first_contact_date: lead.first_contact_date || now,
      last_contact_date: now,
      history: updatedHistory,
      proposal_text: proposalMarkdown,
      proposal_sent: 1,
      labels: lead.labels || [],
      probability: lead.probability || 50,
      next_contact_date: lead.next_contact_date || ''
    });

    const updated = await dbService.leads.getLeadById(req.params.id);
    
    // Dispatch webhook proposal event
    dispatchWebhookEvent('PROPOSAL_SENT', { lead: updated, services });

    res.json({ proposal: proposalMarkdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Send message / Trigger webhook
router.post('/leads/:id/send-message', validateLeadId, validateMessage, async (req, res) => {
  const { message, channel } = req.body;
  
  try {
    const lead = await dbService.leads.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    console.log(`[API] Enviando mensagem via ${channel} para ${lead.name}...`);
    
    const now = new Date().toISOString();
    const firstContactDate = lead.first_contact_date || now;
    const lastContactDate = now;
    
    // Add interaction to history
    const historyEntry = {
      date: now,
      type: 'message_sent',
      channel: channel,
      description: `Mensagem enviada via ${channel}: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`
    };
    const updatedHistory = Array.isArray(lead.history) ? [...lead.history, historyEntry] : [historyEntry];

    await dbService.leads.updateLeadCrm(req.params.id, {
      owner: lead.owner || '',
      value_negotiated: lead.value_negotiated || 0,
      next_action: lead.next_action || '',
      notes: lead.notes || '',
      status: 'Mensagem enviada',
      first_contact_date: firstContactDate,
      last_contact_date: lastContactDate,
      history: updatedHistory,
      proposal_text: lead.proposal_text || '',
      proposal_sent: lead.proposal_sent || 0,
      labels: lead.labels || [],
      probability: lead.probability || 50,
      next_contact_date: lead.next_contact_date || ''
    });

    const updated = await dbService.leads.getLeadById(req.params.id);
    
    // Dispatch Webhook Message event
    dispatchWebhookEvent('MESSAGE_SENT', { lead: updated, channel, message });

    res.json({ success: true, message: `Mensagem enviada com sucesso via ${channel}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Chat with lead AI
router.post('/leads/:id/chat', validateLeadId, async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória' });
  }

  try {
    const lead = await dbService.leads.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const reply = await chatWithLeadAi(lead, message, history || []);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Trigger manual follow-up processing
router.post('/automation/trigger', async (req, res) => {
  try {
    await processPendingFollowUps();
    res.json({ success: true, message: 'Automações de follow-up disparadas com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Settings Endpoints
router.get('/settings', async (req, res) => {
  try {
    const settings = await dbService.settings.getPublicSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  const settingsObj = req.body;
  if (!settingsObj || typeof settingsObj !== 'object' || Array.isArray(settingsObj)) {
    return res.status(400).json({ error: 'Configurações inválidas.' });
  }
  try {
    await dbService.settings.saveSettings(settingsObj);
    res.json({ success: true, message: 'Configurações salvas com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Webhook simulation endpoint
router.post('/settings/test-webhook', async (req, res) => {
  const { event, url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL do webhook é obrigatória' });
  }
  if (!isSafeExternalUrl(url)) {
    return res.status(400).json({ error: 'URL de webhook inválida ou não permitida.' });
  }
  
  try {
    console.log(`[API Webhook Test] Disparando POST para: ${url}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event || 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        test: true,
        message: 'Esta é uma carga de teste enviada pelo AgenticLeads 2.0!'
      })
    });
    
    if (response.ok) {
      res.json({ success: true, message: 'Webhook de teste enviado com sucesso!' });
    } else {
      res.status(400).json({ error: `O webhook respondeu com status: ${response.status} ${response.statusText}` });
    }
  } catch (err) {
    res.status(500).json({ error: `Falha ao disparar webhook: ${err.message}` });
  }
});

export default router;
