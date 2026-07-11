import { dbService } from './dbService.js';

// Checks and executes due follow-up messages
export const processPendingFollowUps = async () => {
  console.log('[Automation Engine] Verificando sequências de follow-up agendadas...');
  const now = new Date().toISOString();
  
  try {
    // Find all scheduled follow-ups that are past their time and still in 'Agendado' status
    const pending = await dbService.followUps.getPendingFollowUps(now);

    console.log(`[Automation Engine] Encontrados ${pending.length} follow-ups prontos para envio.`);
    
    for (const item of pending) {
      console.log(`[Automation Engine] Enviando mensagem de D+${item.sequence_day} para ${item.lead_name} (${item.whatsapp || item.phone})`);
      
      // Update follow_up status
      await dbService.followUps.updateFollowUpStatus(item.id, 'Enviado', now);
      
      // Update lead status to 'Mensagem enviada' if it was in 'Entrar em contato' or 'Novo Lead'
      if (item.lead_status === 'Novo Lead' || item.lead_status === 'Entrar em contato') {
        await dbService.leads.updateLeadStatus(item.lead_id, 'Mensagem enviada');
      }

      // Here you would fire webhooks/integrations (WhatsApp/Email)
      const webhookUrl = await dbService.settings.getSettingByKey('whatsapp_webhook_url');
      if (webhookUrl && webhookUrl.trim() !== '') {
        try {
          console.log(`[Automation Webhook] Disparando gatilho de WhatsApp para webhook: ${webhookUrl}`);
          // Firing asynchronously to not block execution
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lead_id: item.lead_id,
              name: item.lead_name,
              phone: item.whatsapp || item.phone,
              message: item.message,
              sequence_day: item.sequence_day
            })
          }).catch(err => console.error('[Webhook Error]', err.message));
        } catch (err) {
          console.error('[Webhook Trigger Error]', err.message);
        }
      }
    }
  } catch (err) {
    console.error('[Automation Engine] Erro ao processar follow-ups:', err.message);
  }
};

// Scheduler setup: Runs every 2 minutes in background
let intervalId = null;

export const startScheduler = () => {
  if (intervalId) return;
  
  // Run immediately on start
  processPendingFollowUps();
  
  // Check every 2 minutes
  intervalId = setInterval(() => {
    processPendingFollowUps();
  }, 120 * 1000);
  
  console.log('[Automation Scheduler] Motor de automações iniciado.');
};

export const stopScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Automation Scheduler] Motor de automações desligado.');
  }
};
