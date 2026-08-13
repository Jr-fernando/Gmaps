import express from 'express';
import { dbService } from './services/dbService.js';
import { searchCompanies } from './services/scraperService.js';
import { analyzePresence, enrichLeadPublicContacts } from './services/presenceService.js';
import { qualifyLead, sortQualifiedLeads } from './services/qualificationService.js';
import { generateAiReport, generateProposalText, chatWithLeadAi, prioritizeLeadsWithAi, createOutreachPlan } from './services/aiService.js';
import { deliverOutreachMessage, getChannelConnections } from './services/channelService.js';
import { folderService } from './services/folderService.js';
import { processPendingFollowUps } from './services/cronService.js';
import { validateLeadSearch, validateCrmUpdate, validateLeadId, validateMessage } from './validators/validator.js';
import { dispatchWebhookEvent } from './services/webhookService.js';
import { isSafeExternalUrl } from './utils/validation.js';

const router = express.Router();

const registerLeadContact = async (lead, channel, message, type = 'message_sent') => {
  const now = new Date().toISOString();
  const historyEntry = {
    date: now,
    type,
    channel,
    description: `${type === 'message_sent' ? 'Mensagem enviada' : 'Contato aberto'} via ${channel}: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`,
  };
  await dbService.leads.updateLeadCrm(lead.id, {
    owner: lead.owner || '', value_negotiated: lead.value_negotiated || 0,
    next_action: lead.next_action || '', notes: lead.notes || '',
    status: type === 'message_sent' ? 'Mensagem enviada' : (lead.status || 'Entrar em contato'),
    first_contact_date: lead.first_contact_date || now, last_contact_date: now,
    history: [...(Array.isArray(lead.history) ? lead.history : []), historyEntry],
    proposal_text: lead.proposal_text || '', proposal_sent: lead.proposal_sent || 0,
    labels: lead.labels || [], probability: lead.probability || 50,
    next_contact_date: lead.next_contact_date || '',
  });
  return dbService.leads.getLeadById(lead.id);
};

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
    const requestedLimit = criteria.limit;
    const candidateLimit = criteria.excludeSaved ? Math.min(requestedLimit * 3, 100) : requestedLimit;
    const leads = await searchCompanies(query, city, { ...criteria, limit: candidateLimit });

    const qualified = sortQualifiedLeads(leads.map((lead) => qualifyLead(lead, criteria.needs)), criteria.sortMode);
    const existingLeads = await dbService.leads.findLeadsByNamesAndCity(qualified.map((lead) => lead.name), city);
    const existingByName = new Map(existingLeads.map((lead) => [lead.name, lead]));
    const preliminaryCandidates = (criteria.excludeSaved
      ? qualified.filter((lead) => !existingByName.has(lead.name))
      : qualified
    );
    const enrichedCandidates = [];
    for (let index = 0; index < preliminaryCandidates.length && enrichedCandidates.length < requestedLimit; index += 5) {
      const batch = preliminaryCandidates.slice(index, index + 5);
      const enrichedBatch = await Promise.all(batch.map(enrichLeadPublicContacts));
      enrichedCandidates.push(...enrichedBatch.filter((lead) => !criteria.onlyNoInstagram || !lead.instagram));
    }
    const candidatesToSave = sortQualifiedLeads(
      enrichedCandidates.slice(0, requestedLimit).map((lead) => qualifyLead(lead, criteria.needs)),
      criteria.sortMode,
    );
    const savedLeads = [];
    let newCount = 0;

    // Small batches keep Supabase responsive without creating a long sequential waterfall.
    for (let index = 0; index < candidatesToSave.length; index += 8) {
      const batch = candidatesToSave.slice(index, index + 8);
      const savedBatch = await Promise.all(batch.map(async (lead) => {
        const existing = existingByName.get(lead.name);
        if (existing) {
          const qualification = lead.website_analysis?.qualification;
          const websiteAnalysis = { ...(existing.website_analysis || {}), qualification };
          const socialAnalysis = { ...(existing.social_analysis || {}), qualification };
          await dbService.leads.updateLeadQualification(existing.id, websiteAnalysis, socialAnalysis, lead.opportunity_score);
          return {
            ...existing,
            opportunity_score: lead.opportunity_score,
            website_analysis: websiteAnalysis,
            social_analysis: socialAnalysis,
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

    const ordered = sortQualifiedLeads(savedLeads, criteria.sortMode).slice(0, requestedLimit);
    let savedSearchId = null;
    try {
      const savedSearchesRaw = await dbService.settings.getSettingByKey('saved_searches');
      let savedSearches = [];
      try { savedSearches = JSON.parse(savedSearchesRaw || '[]'); } catch { savedSearches = []; }
      savedSearchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      savedSearches.unshift({
        id: savedSearchId,
        query,
        city,
        region: criteria.region || '',
        needs: criteria.needs,
        radius: criteria.radius,
        minReviews: criteria.minReviews,
        maxRating: criteria.maxRating,
        onlyNoWebsite: criteria.onlyNoWebsite,
        onlyNoInstagram: criteria.onlyNoInstagram,
        excludeSaved: criteria.excludeSaved,
        sortMode: criteria.sortMode,
        requested: requestedLimit,
        found: ordered.length,
        leadIds: ordered.map((lead) => lead.id),
        createdAt: new Date().toISOString(),
      });
      await dbService.settings.saveSettings({ saved_searches: JSON.stringify(savedSearches.slice(0, 30)) });
    } catch (historyError) {
      console.error('[API Saved Search Write Error]:', historyError.message);
    }
    res.json({
      message: `Busca finalizada. ${ordered.length} leads entregues e ${newCount} adicionados ao CRM.`,
      leads: ordered,
      requested: requestedLimit,
      found: ordered.length,
      newCount,
      searchId: savedSearchId,
      shortfall: Math.max(requestedLimit - ordered.length, 0),
    });
  } catch (err) {
    console.error('[API Error] Falha na busca de leads:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/searches', async (req, res) => {
  try {
    const raw = await dbService.settings.getSettingByKey('saved_searches');
    const parsed = JSON.parse(raw || '[]');
    res.json(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.error('[API Saved Searches Error]:', err.message);
    res.status(500).json({ error: 'Não foi possível carregar as buscas salvas.' });
  }
});

router.get('/searches/:id', async (req, res) => {
  try {
    const raw = await dbService.settings.getSettingByKey('saved_searches');
    let searches = [];
    try { searches = JSON.parse(raw || '[]'); } catch { searches = []; }
    const search = searches.find((item) => String(item.id) === String(req.params.id));
    if (!search) return res.status(404).json({ error: 'Busca salva nÃ£o encontrada.' });
    const leads = await dbService.leads.getLeadsByIds(search.leadIds || []);
    res.json({ search, leads });
  } catch (err) {
    console.error('[API Saved Search Details Error]:', err.message);
    res.status(500).json({ error: 'NÃ£o foi possÃ­vel reabrir a busca salva.' });
  }
});

router.get('/folders', async (req, res) => {
  try { res.json(await folderService.list()); }
  catch (err) { res.status(500).json({ error: 'Não foi possível carregar as pastas.' }); }
});

router.post('/folders', async (req, res) => {
  try { res.status(201).json(await folderService.create(req.body?.name)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/folders/:id', async (req, res) => {
  try { res.json(await folderService.rename(req.params.id, req.body?.name)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/folders/:id', async (req, res) => {
  try { await folderService.remove(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(404).json({ error: err.message }); }
});

router.post('/folders/:id/leads', async (req, res) => {
  try { res.json(await folderService.addLeads(req.params.id, req.body?.leadIds)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/folders/:id/leads', async (req, res) => {
  try { res.json(await folderService.removeLeads(req.params.id, req.body?.leadIds)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/leads/ai-prioritize', async (req, res) => {
  try {
    const leadIds = [...new Set((req.body?.leadIds || []).map(String).filter(Boolean))].slice(0, 100);
    if (!leadIds.length) return res.status(400).json({ error: 'Selecione ao menos uma empresa.' });
    const leads = await dbService.leads.getLeadsByIds(leadIds);
    res.json(await prioritizeLeadsWithAi(leads, req.body?.objective));
  } catch (err) {
    console.error('[AI Prioritization Error]:', err.message);
    res.status(500).json({ error: 'Não foi possível priorizar a seleção agora.' });
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

    const updated = await registerLeadContact(lead, channel, message, 'contact_opened');
    dispatchWebhookEvent('CONTACT_OPENED', { lead: updated, channel, message });
    res.json({ success: true, message: `Contato via ${channel} registrado no CRM.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/outreach/connections', async (_req, res) => {
  try { res.json(await getChannelConnections()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/outreach/messages', async (req, res) => {
  try { res.json(await dbService.outreach.listMessages({ status: req.query.status || '', limit: req.query.limit || 100 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/outreach/plan', async (req, res) => {
  try {
    const leadIds = [...new Set((req.body?.leadIds || []).map(String))].slice(0, 10);
    if (!leadIds.length) return res.status(400).json({ error: 'Selecione ao menos um lead.' });
    const leads = (await Promise.all(leadIds.map((id) => dbService.leads.getLeadById(id)))).filter(Boolean);
    if (!leads.length) return res.status(404).json({ error: 'Nenhum lead foi encontrado.' });
    res.json(await createOutreachPlan(leads, req.body?.objective || ''));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/outreach/messages/:id', async (req, res) => {
  try {
    const current = await dbService.outreach.getMessage(req.params.id);
    if (!current) return res.status(404).json({ error: 'Mensagem não encontrada.' });
    const changes = {};
    if (typeof req.body.subject === 'string') changes.subject = req.body.subject.slice(0, 180);
    if (typeof req.body.message === 'string') changes.message = req.body.message.slice(0, 3000);
    if (['draft', 'approved', 'cancelled'].includes(req.body.status)) changes.status = req.body.status;
    if (req.body.metadata && typeof req.body.metadata === 'object') changes.metadata = { ...current.metadata, ...req.body.metadata };
    res.json(await dbService.outreach.updateMessage(req.params.id, changes));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/outreach/messages/:id/send', async (req, res) => {
  let item;
  try {
    item = await dbService.outreach.getMessage(req.params.id);
    if (!item) return res.status(404).json({ error: 'Mensagem não encontrada.' });
    if (item.status !== 'approved') return res.status(409).json({ error: 'Revise e aprove a mensagem antes do envio.' });
    const connections = await getChannelConnections();
    const sentToday = (await dbService.outreach.listMessages({ status: 'sent', limit: 200 })).filter((message) => String(message.sent_at || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
    if (sentToday >= connections.dailyLimit) return res.status(429).json({ error: `Limite diário de ${connections.dailyLimit} envios atingido.` });
    const delivery = await deliverOutreachMessage(item);
    const sentAt = new Date().toISOString();
    const message = await dbService.outreach.updateMessage(item.id, { status: 'sent', provider: delivery.provider, external_id: delivery.externalId, sent_at: sentAt, error: '' });
    const lead = await dbService.leads.getLeadById(item.lead_id);
    const updatedLead = await registerLeadContact(lead, item.channel, item.message, 'message_sent');
    dispatchWebhookEvent('MESSAGE_SENT', { lead: updatedLead, channel: item.channel, message: item.message, externalId: delivery.externalId });
    res.json({ success: true, message, lead: updatedLead });
  } catch (err) {
    if (item) await dbService.outreach.updateMessage(item.id, { status: 'failed', error: err.message }).catch(() => {});
    res.status(502).json({ error: err.message });
  }
});

router.post('/outreach/messages/:id/handoff', async (req, res) => {
  try {
    const item = await dbService.outreach.getMessage(req.params.id);
    if (!item) return res.status(404).json({ error: 'Mensagem não encontrada.' });
    const message = await dbService.outreach.updateMessage(item.id, { status: 'handed_off' });
    const lead = await dbService.leads.getLeadById(item.lead_id);
    const updatedLead = await registerLeadContact(lead, item.channel, item.message, 'contact_opened');
    res.json({ success: true, message, lead: updatedLead });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
