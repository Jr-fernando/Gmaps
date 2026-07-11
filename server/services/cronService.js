import { dbAll, dbRun } from '../db.js';

// Checks and executes due follow-up messages
export const processPendingFollowUps = async () => {
  console.log('[Automation Engine] Verificando sequências de follow-up agendadas...');
  const now = new Date().toISOString();
  
  try {
    // Find all scheduled follow-ups that are past their time and still in 'Agendado' status
    const pending = await dbAll(
      `SELECT f.*, l.name as lead_name, l.phone, l.whatsapp, l.status as lead_status 
       FROM follow_ups f
       JOIN leads l ON f.lead_id = l.id
       WHERE f.status = 'Agendado' AND f.scheduled_for <= ?`,
       [now]
    );

    console.log(`[Automation Engine] Encontrados ${pending.length} follow-ups prontos para envio.`);
    
    for (const item of pending) {
      console.log(`[Automation Engine] Enviando mensagem de D+${item.sequence_day} para ${item.lead_name} (${item.whatsapp || item.phone})`);
      
      // Update follow_up status
      await dbRun(
        `UPDATE follow_ups SET status = 'Enviado', sent_at = ? WHERE id = ?`,
        [now, item.id]
      );
      
      // Update lead status to 'Mensagem enviada' if it was in 'Entrar em contato' or 'Novo Lead'
      if (item.lead_status === 'Novo Lead' || item.lead_status === 'Entrar em contato') {
        await dbRun(
          `UPDATE leads SET status = 'Mensagem enviada', updated_at = ? WHERE id = ?`,
          [now, item.lead_id]
        );
      }

      // Here you would fire webhooks/integrations (WhatsApp/Email)
      const whatsappWebhook = await dbAll("SELECT value FROM settings WHERE key = 'whatsapp_webhook_url'");
      const webhookUrl = whatsappWebhook[0]?.value;
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
