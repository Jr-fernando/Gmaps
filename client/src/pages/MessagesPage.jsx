import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Check, Copy, Instagram, Mail, MessageCircle, Search, Send, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react';
import { leadService, outreachService } from '../services/api';

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
];
const STATUS = { draft: 'Rascunho', approved: 'Aprovada', sent: 'Enviada', failed: 'Falhou', handed_off: 'Canal aberto', cancelled: 'Cancelada' };
const channelContact = (lead, channel) => channel === 'email' ? lead?.email : channel === 'instagram' ? (lead?.instagram_link || lead?.instagram) : (lead?.whatsapp || lead?.phone);
const isContacted = (lead) => !['Novo Lead', 'Entrar em contato'].includes(lead?.status || 'Novo Lead');

export default function MessagesPage({ onLeadUpdated, onNavigate }) {
  const [leads, setLeads] = useState([]);
  const [queue, setQueue] = useState([]);
  const [connections, setConnections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [activeMessageId, setActiveMessageId] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [subject, setSubject] = useState('');
  const [instruction, setInstruction] = useState('Inicie uma conversa consultiva e peça permissão para enviar um diagnóstico curto.');
  const [draft, setDraft] = useState('');
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  const load = useCallback(async () => {
    const [leadData, connectionData, messageData] = await Promise.all([leadService.getLeads(), outreachService.getConnections(), outreachService.getMessages()]);
    setLeads(leadData || []); setConnections(connectionData); setQueue(messageData || []);
    if (leadData?.length) setSelectedId((current) => current || String(leadData[0].id));
  }, []);
  useEffect(() => { load().catch((error) => setNotice(error.message)).finally(() => setLoading(false)); }, [load]);

  const selectedLead = useMemo(() => leads.find((lead) => String(lead.id) === selectedId), [leads, selectedId]);
  const activeMessage = useMemo(() => queue.find((item) => item.id === activeMessageId), [queue, activeMessageId]);
  const visibleLeads = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    return term ? leads.filter((lead) => `${lead.name || ''} ${lead.segment || ''} ${lead.city || ''}`.toLocaleLowerCase('pt-BR').includes(term)) : leads;
  }, [leads, query]);
  const contact = channelContact(selectedLead, channel);

  const selectLead = (id) => { setSelectedId(String(id)); setActiveMessageId(''); setDraft(''); setSubject(''); setHistory([]); setNotice(''); setWhatsappOptIn(false); };
  const selectQueueItem = (item) => {
    setActiveMessageId(item.id); setSelectedId(String(item.lead_id)); setChannel(item.channel); setSubject(item.subject || ''); setDraft(item.message || '');
    setWhatsappOptIn(Boolean(item.metadata?.whatsappOptIn)); setNotice('');
  };
  const generateDraft = async () => {
    if (!selectedLead || !instruction.trim()) return;
    setBusy('generate'); setNotice('');
    try {
      const prompt = `Canal: ${channel}. ${instruction.trim()} Use somente os dados verificados do lead. Não invente informações. Entregue somente a mensagem pronta.`;
      const data = await leadService.sendChat(selectedLead.id, prompt, history);
      setDraft(data.reply || ''); setHistory((current) => [...current, { sender: 'user', text: prompt }, { sender: 'assistant', text: data.reply || '' }]);
    } catch (error) { setNotice(error.message); } finally { setBusy(''); }
  };
  const prepareBatch = async () => {
    const candidates = leads.filter((lead) => !isContacted(lead) && (lead.email || lead.whatsapp || lead.phone || lead.instagram)).slice(0, 5);
    if (!candidates.length) return setNotice('Não há leads novos com contato verificado para preparar.');
    setBusy('batch'); setNotice('');
    try {
      const result = await outreachService.createPlan(candidates.map((lead) => lead.id), instruction);
      const refreshed = await outreachService.getMessages(); setQueue(refreshed || []);
      if (result.messages?.[0]) selectQueueItem({ ...result.messages[0], lead_id: result.messages[0].lead_id });
      setNotice(`${result.messages?.length || 0} abordagens preparadas pela IA. Revise antes de aprovar.`);
    } catch (error) { setNotice(error.message); } finally { setBusy(''); }
  };
  const saveMessage = async (status = activeMessage?.status || 'draft') => {
    if (!activeMessageId) return setNotice('Prepare uma fila com a IA antes de salvar este rascunho.');
    setBusy(status); setNotice('');
    try {
      const updated = await outreachService.updateMessage(activeMessageId, { subject, message: draft, status, metadata: { whatsappOptIn } });
      setQueue((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setNotice(status === 'approved' ? 'Mensagem aprovada e pronta para envio.' : 'Rascunho salvo.');
    } catch (error) { setNotice(error.message); } finally { setBusy(''); }
  };
  const copyDraft = async () => { if (!draft) return; await navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const openChannel = () => {
    if (!selectedLead || !contact || !draft) return;
    if (channel === 'email') window.open(`mailto:${contact}?subject=${encodeURIComponent(subject || `Uma ideia para ${selectedLead.name}`)}&body=${encodeURIComponent(draft)}`, '_blank');
    else if (channel === 'instagram') window.open(String(contact).startsWith('http') ? contact : `https://instagram.com/${String(contact).replace(/^@/, '')}`, '_blank', 'noopener,noreferrer');
    else window.open(`https://wa.me/${String(contact).replace(/\D/g, '')}?text=${encodeURIComponent(draft)}`, '_blank', 'noopener,noreferrer');
  };
  const handoff = async () => { openChannel(); if (!activeMessageId) return; try { await outreachService.handoff(activeMessageId); await load(); setNotice('Canal aberto e ação registrada no CRM.'); onLeadUpdated?.(); } catch (error) { setNotice(error.message); } };
  const sendNow = async () => {
    if (!activeMessageId) return;
    setBusy('send'); setNotice('');
    try {
      await outreachService.updateMessage(activeMessageId, { subject, message: draft, status: 'approved', metadata: { whatsappOptIn } });
      await outreachService.sendMessage(activeMessageId); await load(); setNotice('Envio confirmado pelo provedor e registrado no CRM.'); onLeadUpdated?.();
    } catch (error) { setNotice(error.message); } finally { setBusy(''); }
  };
  const directEligible = Boolean(connections?.[channel]?.connected && (channel === 'email' || (channel === 'whatsapp' && whatsappOptIn) || (channel === 'instagram' && activeMessage?.metadata?.instagramRecipientId)));

  return <div className="messages-page animate-fade-in">
    <section className="messages-heading">
      <div><span className="eyebrow"><Sparkles size={13} /> Agente comercial supervisionado</span><h1>Central de contato</h1><p>A IA pesquisa o contexto, separa prioridades e prepara abordagens. Você mantém a aprovação final.</p></div>
      <button type="button" className="outreach-batch-button" onClick={prepareBatch} disabled={busy === 'batch'}><WandSparkles size={17} />{busy === 'batch' ? 'Preparando...' : 'Preparar próximos 5'}</button>
    </section>

    <section className="connection-grid">
      {CHANNELS.map(({ id, label, icon: Icon }) => <div key={id} className={connections?.[id]?.connected ? 'connected' : ''}><Icon size={17}/><span><strong>{label}</strong><small>{connections?.[id]?.connected ? connections[id].detail : connections?.[id]?.detail || 'Configuração pendente'}</small></span>{connections?.[id]?.connected ? <i>Conectado</i> : <button type="button" className="connection-action" onClick={() => onNavigate?.('settings')}>Configurar</button>}</div>)}
      <div className="approval-card"><ShieldCheck size={17}/><span><strong>Revisão humana</strong><small>Obrigatória antes de cada envio</small></span><i>Ativa</i></div>
    </section>

    <section className="outreach-queue">
      <header><div><Bot size={16}/><strong>Fila preparada pela IA</strong></div><span>{queue.filter((item) => item.status === 'draft').length} para revisar · limite {connections?.dailyLimit || 20}/dia</span></header>
      <div>{queue.length ? queue.slice(0, 8).map((item) => <button type="button" key={item.id} className={activeMessageId === item.id ? 'active' : ''} onClick={() => selectQueueItem(item)}><strong>{item.lead?.name || 'Lead'}</strong><span>{CHANNELS.find((entry) => entry.id === item.channel)?.label}</span><i className={`status-${item.status}`}>{STATUS[item.status] || item.status}</i></button>) : <p>Nenhuma abordagem preparada ainda.</p>}</div>
    </section>

    <section className="messages-workspace">
      <aside className="message-lead-list"><div className="message-lead-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead ou nicho"/></div>
        {loading ? <p>Carregando...</p> : visibleLeads.map((lead) => <button type="button" key={lead.id} className={selectedId === String(lead.id) ? 'active' : ''} onClick={() => selectLead(lead.id)}><span>{lead.name?.slice(0, 1) || '?'}</span><div><strong>{lead.name}</strong><small>{lead.segment || 'Empresa local'} · {lead.city || 'Sem cidade'}</small></div><i className={isContacted(lead) ? 'sent' : ''}/></button>)}
      </aside>
      <div className="message-composer">{!selectedLead ? <div className="message-empty"><MessageCircle/><strong>Selecione um lead</strong></div> : <>
        <header><div><span className="message-avatar">{selectedLead.name?.slice(0, 1)}</span><div><strong>{selectedLead.name}</strong><small>{selectedLead.segment} · {selectedLead.city}</small></div></div><span className={`message-contact-status ${isContacted(selectedLead) ? 'sent' : ''}`}><Check size={13}/>{isContacted(selectedLead) ? 'Contato realizado' : 'Novo contato'}</span></header>
        <div className="channel-tabs">{CHANNELS.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={channel === id ? 'active' : ''} onClick={() => { setChannel(id); setActiveMessageId(''); setDraft(''); }}><Icon size={15}/>{label}<i className={channelContact(selectedLead, id) ? 'available' : ''}/></button>)}</div>
        <div className="channel-status"><span>{contact ? `Contato encontrado: ${contact}` : 'Contato não encontrado para este canal.'}</span><em>{connections?.[channel]?.connected ? 'Provedor conectado' : 'Use a abertura assistida'}</em></div>
        <label className="assistant-instruction"><span>Orientação para a IA</span><textarea value={instruction} onChange={(event) => setInstruction(event.target.value)}/><button type="button" onClick={generateDraft} disabled={busy === 'generate'}><Sparkles size={15}/>{busy === 'generate' ? 'Gerando...' : 'Gerar mensagem'}</button></label>
        {channel === 'email' && <label className="message-subject"><span>Assunto</span><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={`Uma ideia para ${selectedLead.name}`}/></label>}
        <label className="draft-editor"><span>Mensagem para revisar</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="A abordagem personalizada aparecerá aqui."/></label>
        {channel === 'whatsapp' && connections?.whatsapp?.connected && <label className="consent-check"><input type="checkbox" checked={whatsappOptIn} onChange={(event) => setWhatsappOptIn(event.target.checked)}/><span>Confirmo que este contato autorizou mensagens da empresa.</span></label>}
        {notice && <p className="message-notice">{notice}</p>}
        <footer><button type="button" className="message-secondary" onClick={copyDraft} disabled={!draft}><Copy size={15}/>{copied ? 'Copiado' : 'Copiar'}</button>{activeMessageId && <><button type="button" className="message-secondary" onClick={() => saveMessage('draft')} disabled={!draft}>Salvar</button><button type="button" className="message-secondary" onClick={() => saveMessage('approved')} disabled={!draft}><ShieldCheck size={15}/>Aprovar</button></>}<button type="button" className="message-secondary" onClick={handoff} disabled={!draft || !contact}><Send size={15}/>Abrir canal</button><button type="button" className="message-primary" onClick={sendNow} disabled={!draft || !activeMessageId || !directEligible || busy === 'send'}><Send size={15}/>{busy === 'send' ? 'Enviando...' : 'Enviar agora'}</button></footer>
      </>}</div>
    </section>
  </div>;
}
