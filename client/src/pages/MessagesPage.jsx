import { useEffect, useMemo, useState } from 'react';
import { Bot, Check, Copy, Instagram, Mail, MessageCircle, Search, Send, Sparkles } from 'lucide-react';
import { leadService } from '../services/api';

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
];

const channelContact = (lead, channel) => {
  if (channel === 'email') return lead?.email || '';
  if (channel === 'instagram') return lead?.instagram || '';
  return lead?.whatsapp || lead?.phone || '';
};
const isContacted = (lead) => !['Novo Lead', 'Entrar em contato'].includes(lead?.status || 'Novo Lead');

export default function MessagesPage({ onLeadUpdated }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [instruction, setInstruction] = useState('Crie uma abordagem curta, personalizada e consultiva para iniciar o contato.');
  const [draft, setDraft] = useState('');
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    leadService.getLeads().then((data) => {
      setLeads(data || []);
      if (data?.length) setSelectedId(String(data[0].id));
    }).catch(() => setLeads([])).finally(() => setLoading(false));
  }, []);

  const selectedLead = useMemo(() => leads.find((lead) => String(lead.id) === selectedId), [leads, selectedId]);
  const visibleLeads = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return leads;
    return leads.filter((lead) => `${lead.name || ''} ${lead.segment || ''} ${lead.city || ''}`.toLocaleLowerCase('pt-BR').includes(term));
  }, [leads, query]);
  const contact = channelContact(selectedLead, channel);

  const selectLead = (id) => {
    setSelectedId(String(id));
    setDraft('');
    setHistory([]);
    setNotice('');
  };

  const generateDraft = async () => {
    if (!selectedLead || !instruction.trim()) return;
    setGenerating(true);
    setNotice('');
    try {
      const prompt = `Canal: ${channel}. ${instruction.trim()} Entregue somente a mensagem pronta para envio.`;
      const data = await leadService.sendChat(selectedLead.id, prompt, history);
      setDraft(data.reply || '');
      setHistory((current) => [...current, { sender: 'user', text: prompt }, { sender: 'assistant', text: data.reply || '' }]);
    } catch (error) {
      setNotice(error.message || 'Não foi possível gerar a mensagem.');
    } finally {
      setGenerating(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice('Não foi possível copiar automaticamente. Selecione o texto da mensagem para copiar.');
    }
  };

  const openChannel = () => {
    if (!selectedLead || !contact || !draft) return;
    if (channel === 'email') {
      window.open(`mailto:${contact}?subject=${encodeURIComponent(`Oportunidade para ${selectedLead.name}`)}&body=${encodeURIComponent(draft)}`, '_blank');
      return;
    }
    if (channel === 'instagram') {
      const profile = contact.startsWith('http') ? contact : `https://instagram.com/${contact.replace(/^@/, '')}`;
      window.open(profile, '_blank', 'noopener,noreferrer');
      return;
    }
    const phone = contact.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(draft)}`, '_blank', 'noopener,noreferrer');
  };

  const registerContact = async () => {
    if (!selectedLead || !draft) return;
    try {
      await leadService.sendMessage(selectedLead.id, draft, channel);
      setLeads((current) => current.map((lead) => String(lead.id) === selectedId ? { ...lead, status: 'Mensagem enviada' } : lead));
      setNotice('Contato registrado no histórico do lead.');
      onLeadUpdated?.();
    } catch (error) {
      setNotice(error.message || 'Não foi possível registrar o contato.');
    }
  };

  return <div className="messages-page animate-fade-in">
    <section className="messages-heading">
      <div><span className="eyebrow"><Sparkles size={13} /> Central de abordagem</span><h1>Chat e mensagens</h1><p>Use a IA para preparar a conversa, abra o canal correto e mantenha o contato registrado no CRM.</p></div>
      <div className="integration-note"><Bot size={18} /><span><strong>Assistente pronto</strong><small>O envio automático será ativado quando os canais forem conectados.</small></span></div>
    </section>

    <section className="messages-workspace">
      <aside className="message-lead-list">
        <div className="message-lead-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead ou nicho" /></div>
        {loading ? <p>Carregando leads...</p> : visibleLeads.length === 0 ? <p>Nenhum lead encontrado.</p> : visibleLeads.map((lead) => (
          <button type="button" key={lead.id} className={selectedId === String(lead.id) ? 'active' : ''} onClick={() => selectLead(lead.id)}>
            <span>{lead.name?.slice(0, 1) || '?'}</span><div><strong>{lead.name}</strong><small>{lead.segment || lead.category || 'Empresa local'} · {lead.city || 'Sem cidade'}</small></div><i className={isContacted(lead) ? 'sent' : ''} />
          </button>
        ))}
      </aside>

      <div className="message-composer">
        {!selectedLead ? <div className="message-empty"><MessageCircle size={30} /><strong>Selecione um lead</strong><span>Escolha uma empresa para preparar a abordagem.</span></div> : <>
          <header><div><span className="message-avatar">{selectedLead.name?.slice(0, 1)}</span><div><strong>{selectedLead.name}</strong><small>{selectedLead.segment || selectedLead.category} · {selectedLead.city}</small></div></div><span className={`message-contact-status ${isContacted(selectedLead) ? 'sent' : ''}`}><Check size={13} /> {isContacted(selectedLead) ? 'Contato realizado' : 'Ainda não enviado'}</span></header>

          <div className="channel-tabs">{CHANNELS.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={channel === id ? 'active' : ''} onClick={() => { setChannel(id); setDraft(''); setNotice(''); }}><Icon size={15} />{label}<i className={channelContact(selectedLead, id) ? 'available' : ''} /></button>)}</div>
          <div className="channel-status"><span>{contact ? `Contato encontrado: ${contact}` : `Nenhum contato de ${CHANNELS.find((item) => item.id === channel)?.label} cadastrado.`}</span><em>Envio direto ainda não conectado</em></div>

          <label className="assistant-instruction"><span>O que a IA deve preparar?</span><textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} /><button type="button" onClick={generateDraft} disabled={generating}>{generating ? 'Gerando...' : <><Sparkles size={15} /> Gerar mensagem</>}</button></label>
          <label className="draft-editor"><span>Mensagem pronta para revisar</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="A mensagem personalizada aparecerá aqui." /></label>
          {notice && <p className="message-notice">{notice}</p>}
          <footer><button type="button" className="message-secondary" onClick={copyDraft} disabled={!draft}><Copy size={15} />{copied ? 'Copiado' : 'Copiar'}</button><button type="button" className="message-secondary" onClick={registerContact} disabled={!draft}><Check size={15} />Registrar no CRM</button><button type="button" className="message-primary" onClick={openChannel} disabled={!draft || !contact}><Send size={15} />Abrir {CHANNELS.find((item) => item.id === channel)?.label}</button></footer>
        </>}
      </div>
    </section>
  </div>;
}
