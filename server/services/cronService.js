import { dbService } from './dbService.js';
import { isSafeExternalUrl } from '../utils/validation.js';

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
      
      const webhookUrl = await dbService.settings.getSettingByKey('whatsapp_webhook_url');
      if (!webhookUrl || !isSafeExternalUrl(webhookUrl)) {
        console.warn('[Automation Engine] Follow-up mantido como agendado: webhook ausente ou inválido.');
        continue;
      }

      try {
        console.log(`[Automation Webhook] Disparando gatilho de WhatsApp para webhook: ${webhookUrl}`);
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: item.lead_id,
            name: item.lead_name,
            phone: item.whatsapp || item.phone,
            message: item.message,
            sequence_day: item.sequence_day
          }),
          signal: AbortSignal.timeout(5000),
          redirect: 'error'
        });
        if (!response.ok) throw new Error(`Webhook respondeu ${response.status}`);

        await dbService.followUps.updateFollowUpStatus(item.id, 'Enviado', now);
        if (item.lead_status === 'Novo Lead' || item.lead_status === 'Entrar em contato') {
          await dbService.leads.updateLeadStatus(item.lead_id, 'Mensagem enviada');
        }
      } catch (err) {
        console.error('[Automation Webhook Error] Follow-up não foi marcado como enviado:', err.message);
      }
    }
  } catch (err) {
    console.error('[Automation Engine] Erro ao processar follow-ups:', err.message);
  }
};

// Scheduler setup: Runs every 2 minutes in background
let intervalId = null;

export const startScheduler = () => {
  if (process.env.VERCEL) {
    console.log('[Automation Scheduler] Ambiente Vercel Serverless detectado. O motor de automação por setInterval foi desativado para evitar problemas de execução.');
    return;
  }

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
