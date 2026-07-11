import axios from 'axios';
import { dbService } from './dbService.js';

export const dispatchWebhookEvent = async (event, payload) => {
  try {
    // Get custom webhook URLs configured in settings
    const settings = await dbService.settings.getSettings();
    
    // Find key: webhook_url_new_lead, webhook_url_status_changed, etc.
    const key = `webhook_url_${event.toLowerCase()}`;
    const webhookUrl = settings[key] || settings.whatsapp_webhook_url;
    
    if (!webhookUrl || webhookUrl.trim() === '') {
      return;
    }

    console.log(`[Webhook Dispatcher] Enviando evento '${event}' para: ${webhookUrl}...`);
    
    axios.post(webhookUrl, {
      event,
      timestamp: new Date().toISOString(),
      data: payload
    }, { timeout: 3000 })
    .catch(err => {
      console.error(`[Webhook Dispatcher Error] Falha ao entregar '${event}':`, err.message);
    });

  } catch (err) {
    console.error(`[Webhook Dispatcher Error] Falha ao processar evento '${event}':`, err.message);
  }
};
