import { Resend } from 'resend';
import { dbService } from './dbService.js';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';
const graphUrl = (path) => `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;

const getSettings = async () => dbService.settings.getSettings();
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

export const getChannelConnections = async () => {
  const settings = await getSettings();
  return {
    email: {
      connected: Boolean(settings.resend_api_key && settings.email_from),
      provider: 'Resend',
      detail: settings.email_from ? `Remetente: ${settings.email_from}` : 'Adicione RESEND_API_KEY e EMAIL_FROM na Vercel.',
      supportsDirect: Boolean(settings.resend_api_key && settings.email_from),
    },
    whatsapp: {
      connected: Boolean(settings.meta_access_token && settings.whatsapp_phone_number_id),
      provider: 'WhatsApp Cloud API',
      detail: settings.whatsapp_phone_number_id ? 'Conta da Meta configurada.' : 'Adicione META_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID.',
      supportsDirect: Boolean(settings.meta_access_token && settings.whatsapp_phone_number_id),
    },
    instagram: {
      connected: Boolean(settings.meta_access_token && settings.instagram_account_id),
      provider: 'Instagram Messaging API',
      detail: settings.instagram_account_id ? 'Conta profissional configurada.' : 'Adicione META_ACCESS_TOKEN e INSTAGRAM_ACCOUNT_ID.',
      supportsDirect: Boolean(settings.meta_access_token && settings.instagram_account_id),
    },
    approvalRequired: settings.outreach_approval_required !== 'false',
    dailyLimit: Math.min(Math.max(Number(settings.outreach_daily_limit) || 20, 1), 100),
  };
};

const sendEmail = async (item, settings) => {
  if (!settings.resend_api_key || !settings.email_from) throw new Error('Conecte o Resend e configure o remetente antes de enviar e-mails.');
  if (!item.lead?.email) throw new Error('Este lead não possui e-mail verificado.');
  const resend = new Resend(settings.resend_api_key);
  const { data, error } = await resend.emails.send({
    from: settings.email_from,
    to: [item.lead.email],
    subject: item.subject || `Uma ideia para ${item.lead.name}`,
    text: item.message,
  }, { idempotencyKey: `leadmap/${item.id}` });
  if (error) throw new Error(error.message || 'O provedor recusou o e-mail.');
  return { provider: 'resend', externalId: data?.id || '' };
};

const sendWhatsApp = async (item, settings) => {
  if (!settings.meta_access_token || !settings.whatsapp_phone_number_id) throw new Error('Conecte o WhatsApp Cloud API antes do envio direto.');
  if (!item.metadata?.whatsappOptIn) throw new Error('O envio automático exige consentimento registrado. Use “Abrir WhatsApp” para o primeiro contato.');
  const phone = normalizePhone(item.lead?.whatsapp || item.lead?.phone);
  if (!phone) throw new Error('Este lead não possui WhatsApp verificado.');
  const response = await fetch(graphUrl(`${settings.whatsapp_phone_number_id}/messages`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.meta_access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: phone, type: 'text', text: { preview_url: false, body: item.message } }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `WhatsApp respondeu ${response.status}.`);
  return { provider: 'whatsapp_cloud', externalId: data.messages?.[0]?.id || '' };
};

const sendInstagram = async (item, settings) => {
  if (!settings.meta_access_token || !settings.instagram_account_id) throw new Error('Conecte a conta profissional do Instagram antes do envio direto.');
  const recipientId = item.metadata?.instagramRecipientId || item.lead?.social_analysis?.instagramRecipientId;
  if (!recipientId) throw new Error('A API do Instagram só permite responder a uma conversa elegível. Abra o perfil para iniciar o primeiro contato.');
  const response = await fetch(graphUrl(`${settings.instagram_account_id}/messages`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.meta_access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: item.message } }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Instagram respondeu ${response.status}.`);
  return { provider: 'instagram_messaging', externalId: data.message_id || '' };
};

export const deliverOutreachMessage = async (item) => {
  const settings = await getSettings();
  if (item.channel === 'email') return sendEmail(item, settings);
  if (item.channel === 'whatsapp') return sendWhatsApp(item, settings);
  if (item.channel === 'instagram') return sendInstagram(item, settings);
  throw new Error('Canal não suportado.');
};
