import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Globe, Phone, Mail, MapPin, Instagram, Facebook, Star, Clock,
  Send, ShieldAlert, FileText, Bot, RefreshCw, MessageSquare, Copy, Check, Save, User, DollarSign, Calendar, Eye, PlusCircle
} from 'lucide-react';

const STATUS_OPTIONS = [
  'Novo Lead', 'Entrar em contato', 'Mensagem enviada', 'Respondeu', 
  'Negociação', 'Proposta enviada', 'Cliente', 'Perdido'
];

export default function CompanyDetailsView({ leadId, onBack, onLeadUpdated }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [copiedKey, setCopiedKey] = useState('');
  
  // CRM States
  const [crmOwner, setCrmOwner] = useState('');
  const [crmValue, setCrmValue] = useState('');
  const [crmNextAction, setCrmNextAction] = useState('');
  const [crmNotes, setCrmNotes] = useState('');
  const [crmStatus, setCrmStatus] = useState('');
  const [crmFirstContactDate, setCrmFirstContactDate] = useState('');
  const [crmLastContactDate, setCrmLastContactDate] = useState('');
  const [crmHistory, setCrmHistory] = useState([]);
  const [newHistoryText, setNewHistoryText] = useState('');
  const [crmProposalSent, setCrmProposalSent] = useState(false);
  const [crmProposalText, setCrmProposalText] = useState('');
  const [savingCrm, setSavingCrm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // IA States
  const [regenerating, setRegenerating] = useState(false);
  const [proposalServices, setProposalServices] = useState([
    'Criação de Website Institucional'
  ]);
  const [proposalText, setProposalText] = useState('');
  const [generatingProposal, setGeneratingProposal] = useState(false);

  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Active message template state
  const [activeMessageChannel, setActiveMessageChannel] = useState('whatsapp');
  const [activeMessageStage, setActiveMessageStage] = useState('firstContact');
  const [editableMessage, setEditableMessage] = useState('');

  const fetchLeadDetails = () => {
    setLoading(true);
    fetch(`/api/leads/${leadId}`)
      .then(res => res.json())
      .then(data => {
        setLead(data);
        setCrmOwner(data.owner || '');
        setCrmValue(data.value_negotiated || '');
        setCrmNextAction(data.next_action || '');
        setCrmNotes(data.notes || '');
        setCrmStatus(data.status || 'Novo Lead');
        setCrmFirstContactDate(data.first_contact_date || '');
        setCrmLastContactDate(data.last_contact_date || '');
        setCrmHistory(data.history || []);
        setCrmProposalSent(data.proposal_sent === 1 || data.proposal_sent === true);
        setCrmProposalText(data.proposal_text || '');
        
        // Initial setup for editable message
        const initialMsg = data.prospectingMessages?.[activeMessageChannel]?.[activeMessageStage] 
          || data.first_message 
          || '';
        setEditableMessage(initialMsg);
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar detalhes do lead:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (leadId) fetchLeadDetails();
  }, [leadId]);

  // Sync editable message when channel/stage tabs change
  useEffect(() => {
    if (!lead) return;
    const msg = lead.prospectingMessages?.[activeMessageChannel]?.[activeMessageStage] 
      || (activeMessageStage === 'firstContact' ? lead.first_message : '') 
      || '';
    setEditableMessage(msg);
  }, [activeMessageChannel, activeMessageStage, lead]);

  const handleSaveCrm = async (e) => {
    if (e) e.preventDefault();
    setSavingCrm(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/leads/${lead.id}/crm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: crmOwner,
          value_negotiated: parseFloat(crmValue || 0),
          next_action: crmNextAction,
          notes: crmNotes,
          status: crmStatus,
          first_contact_date: crmFirstContactDate,
          last_contact_date: crmLastContactDate,
          history: crmHistory,
          proposal_text: crmProposalText,
          proposal_sent: crmProposalSent
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setLead(prev => ({ 
          ...prev, 
          owner: crmOwner, 
          value_negotiated: parseFloat(crmValue || 0),
          next_action: crmNextAction,
          notes: crmNotes,
          status: crmStatus,
          first_contact_date: crmFirstContactDate,
          last_contact_date: crmLastContactDate,
          history: crmHistory,
          proposal_text: crmProposalText,
          proposal_sent: crmProposalSent
        }));
        if (onLeadUpdated) onLeadUpdated();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar CRM:', err);
      alert('Erro ao salvar dados do CRM.');
    } finally {
      setSavingCrm(false);
    }
  };

  const handleAddHistoryLog = (e) => {
    e.preventDefault();
    if (!newHistoryText.trim()) return;
    
    const now = new Date().toISOString();
    const newEvent = {
      date: now,
      type: 'manual_note',
      description: newHistoryText.trim()
    };
    
    const updatedHistory = [...crmHistory, newEvent];
    const firstContact = crmFirstContactDate || now;
    
    setCrmHistory(updatedHistory);
    setCrmLastContactDate(now);
    if (!crmFirstContactDate) setCrmFirstContactDate(now);
    setNewHistoryText('');
    
    // Automatically trigger saving of CRM
    fetch(`/api/leads/${lead.id}/crm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner: crmOwner,
        value_negotiated: parseFloat(crmValue || 0),
        next_action: crmNextAction,
        notes: crmNotes,
        status: crmStatus,
        first_contact_date: firstContact,
        last_contact_date: now,
        history: updatedHistory,
        proposal_text: crmProposalText,
        proposal_sent: crmProposalSent
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setLead(prev => ({ 
          ...prev, 
          history: updatedHistory,
          last_contact_date: now,
          first_contact_date: firstContact
        }));
        if (onLeadUpdated) onLeadUpdated();
      }
    })
    .catch(err => console.error('Erro ao adicionar histórico:', err));
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleSendMessage = async (channel) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editableMessage, channel })
      });
      const data = await res.json();
      
      // Reload lead details to fetch updated history & last contact dates
      fetch(`/api/leads/${lead.id}`)
        .then(r => r.json())
        .then(updated => {
          setLead(updated);
          setCrmStatus(updated.status);
          setCrmLastContactDate(updated.last_contact_date);
          setCrmFirstContactDate(updated.first_contact_date);
          setCrmHistory(updated.history);
        });

      if (onLeadUpdated) onLeadUpdated();

      if (channel === 'whatsapp' && lead.whatsapp) {
        const text = encodeURIComponent(editableMessage);
        window.open(`https://api.whatsapp.com/send?phone=${lead.whatsapp}&text=${text}`, '_blank');
      } else if (channel === 'email' && lead.email) {
        window.open(`mailto:${lead.email}?subject=${encodeURIComponent('Oportunidades de Presença Digital - ' + lead.name)}&body=${encodeURIComponent(editableMessage)}`, '_blank');
      } else {
        alert(`Disparo simulado via ${channel.toUpperCase()} concluído!`);
      }
    } catch (err) {
      console.error('Erro ao disparar mensagem:', err);
    }
  };

  const handleRegenerateReport = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/generate-message`, { method: 'POST' });
      const data = await response.json();
      
      // Refetch details to populate advanced messages too
      fetch(`/api/leads/${lead.id}`)
        .then(res => res.json())
        .then(updated => {
          setLead(updated);
          setRegenerating(false);
        });
    } catch (err) {
      console.error('Erro ao regenerar diagnóstico:', err);
      setRegenerating(false);
    }
  };

  const handleGenerateProposal = async () => {
    setGeneratingProposal(true);
    setProposalText('');
    try {
      const response = await fetch(`/api/leads/${lead.id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: proposalServices })
      });
      const data = await response.json();
      setProposalText(data.proposal);
      setCrmProposalText(data.proposal);
      setCrmProposalSent(true);
      
      // Reload lead details
      fetch(`/api/leads/${lead.id}`)
        .then(r => r.json())
        .then(updated => {
          setLead(updated);
          setCrmStatus(updated.status);
          setCrmLastContactDate(updated.last_contact_date);
          setCrmHistory(updated.history);
        });
        
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      console.error('Erro ao gerar proposta:', err);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userMsg = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await fetch(`/api/leads/${lead.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage, history: chatHistory })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: 'assistant', text: data.reply }]);
    } catch (err) {
      console.error('Erro no copiloto de IA:', err);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="loader-spinner"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Carregando detalhes da empresa...</p>
      </div>
    );
  }

  const { website_analysis: websiteAnalysis = {}, social_analysis: socialAnalysis = {} } = lead;
  
  // Custom Opportunity badge
  let scoreColor = 'good';
  let scoreText = 'Otimizado';
  if (lead.opportunity_score >= 80) {
    scoreColor = 'critical';
    scoreText = 'Oportunidade Alta';
  } else if (lead.opportunity_score >= 50) {
    scoreColor = 'moderate';
    scoreText = 'Oportunidade Média';
  }

  // OpenStreetMap embed URL using Lat/Lng
  const mapUrl = lead.latitude && lead.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lead.longitude - 0.003}%2C${lead.latitude - 0.002}%2C${lead.longitude + 0.003}%2C${lead.latitude + 0.002}&layer=mapnik&marker=${lead.latitude}%2C${lead.longitude}`
    : null;

  return (
    <div className="company-details-view animate-fade-in">
      {/* Header Bar */}
      <div className="details-header-bar">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Voltar para a Lista
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {lead.gmaps_link && (
            <a href={lead.gmaps_link} target="_blank" rel="noopener noreferrer" className="btn-channel border">
              <Eye size={14} /> Abrir no Google Maps
            </a>
          )}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="btn-channel border">
              <Globe size={14} /> Visitar Website
            </a>
          )}
        </div>
      </div>

      {/* Main Split Profile Layout */}
      <div className="profile-grid">
        
        {/* Left Column - Card Profile & CRM */}
        <div className="profile-left-col">
          <div className="glass-card profile-main-card">
            <span className="profile-segment-badge">{lead.segment}</span>
            <h2 className="profile-company-name">{lead.name}</h2>
            <p className="profile-company-category">{lead.category || 'Categoria não definida'}</p>
            
            <div className="presence-score-badge mini">
              <div className={`score-circle ${scoreColor}`}>{lead.opportunity_score}</div>
              <div className="score-text-details">
                <span className="score-title">{scoreText}</span>
                <span className="score-subtitle">Prioridade Comercial</span>
              </div>
            </div>

            {/* Quick Contact Links */}
            <div className="quick-contacts-list">
              <div className="contact-row">
                <MapPin size={16} className="contact-icon" />
                <span>{lead.address || 'Endereço indisponível'}</span>
              </div>
              <div className="contact-row">
                <Clock size={16} className="contact-icon" />
                <span>{lead.schedule || 'Horário de funcionamento não disponível'}</span>
              </div>
              <div className="contact-row">
                <Phone size={16} className="contact-icon" />
                <span style={{ flexGrow: 1 }}>{lead.phone || 'Telefone indisponível'}</span>
                {lead.phone && (
                  <button className="btn-copy-mini" onClick={() => handleCopy(lead.phone, 'phone')}>
                    {copiedKey === 'phone' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                )}
              </div>
              <div className="contact-row">
                <Globe size={16} className="contact-icon" />
                <span style={{ flexGrow: 1 }}>
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website}</a>
                  ) : 'Sem site oficial'}
                </span>
              </div>
              {lead.whatsapp && (
                <div className="contact-row">
                  <Send size={16} className="contact-icon green" />
                  <span style={{ flexGrow: 1 }}>+{lead.whatsapp}</span>
                  <button className="btn-copy-mini" onClick={() => handleCopy(lead.whatsapp, 'whatsapp')}>
                    {copiedKey === 'whatsapp' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>

            {/* Social media connections */}
            <div className="social-connectors-row">
              {lead.instagram ? (
                <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-pill instagram">
                  <Instagram size={14} /> Instagram
                </a>
              ) : (
                <span className="social-pill disabled"><Instagram size={14} /> Instagram</span>
              )}
              
              {lead.facebook ? (
                <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="social-pill facebook">
                  <Facebook size={14} /> Facebook
                </a>
              ) : (
                <span className="social-pill disabled"><Facebook size={14} /> Facebook</span>
              )}
            </div>
          </div>

          {/* CRM Management Form */}
          <div className="glass-card CRM-form-card">
            <h3 className="section-header-mini">Gestão de Vendas (CRM)</h3>
            
            {/* Quick Contact Timestamps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '0.72rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Primeiro Contato</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>
                  {crmFirstContactDate ? new Date(crmFirstContactDate).toLocaleDateString('pt-BR') : 'Não iniciado'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Último Contato</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>
                  {crmLastContactDate ? new Date(crmLastContactDate).toLocaleDateString('pt-BR') : 'Não iniciado'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveCrm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label-mini">Responsável Comercial</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} className="input-icon-mini" />
                  <input 
                    type="text" 
                    placeholder="Ex: Fernando Souza" 
                    className="input-field-mini"
                    value={crmOwner}
                    onChange={(e) => setCrmOwner(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label-mini">Valor Negociado (R$)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={14} className="input-icon-mini" />
                  <input 
                    type="number" 
                    placeholder="Ex: 2500" 
                    className="input-field-mini"
                    value={crmValue}
                    onChange={(e) => setCrmValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label-mini">Status da Prospecção</label>
                <select 
                  className="input-field-mini"
                  value={crmStatus}
                  onChange={(e) => setCrmStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label-mini">Próxima Ação Comercial</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={14} className="input-icon-mini" />
                  <input 
                    type="text" 
                    placeholder="Ex: Ligar na segunda-feira às 14:00" 
                    className="input-field-mini"
                    value={crmNextAction}
                    onChange={(e) => setCrmNextAction(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label-mini">Notas & Observações Comerciais</label>
                <textarea 
                  placeholder="Observações importantes sobre o lead..." 
                  className="input-textarea-mini"
                  value={crmNotes}
                  onChange={(e) => setCrmNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                {saveSuccess ? (
                  <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ Atualizado!</span>
                ) : <span />}
                
                <button type="submit" className="btn-trigger-cron" style={{ width: 'auto', padding: '8px 16px' }} disabled={savingCrm}>
                  <Save size={14} />
                  {savingCrm ? 'Salvando...' : 'Salvar CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Tabs View Details */}
        <div className="profile-right-col">
          {/* Navigation Tabs */}
          <div className="details-tabs-bar">
            <button className={`details-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
              Geral & Localização
            </button>
            <button className={`details-tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
              Auditoria Web
            </button>
            <button className={`details-tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
              Diagnóstico IA
            </button>
            <button className={`details-tab-btn ${activeTab === 'prospecting' ? 'active' : ''}`} onClick={() => setActiveTab('prospecting')}>
              Mensagens Customizadas
            </button>
            <button className={`details-tab-btn ${activeTab === 'proposal' ? 'active' : ''}`} onClick={() => setActiveTab('proposal')}>
              Proposta Comercial
            </button>
            <button className={`details-tab-btn ${activeTab === 'copilot' ? 'active' : ''}`} onClick={() => setActiveTab('copilot')}>
              Copiloto Comercial
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="details-tab-body">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Localização Geográfica</h3>
                  {mapUrl ? (
                    <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <iframe 
                        title="Localização do Lead"
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        marginHeight="0" 
                        marginWidth="0" 
                        src={mapUrl}
                      />
                    </div>
                  ) : (
                    <div className="empty-state-box">Mapa indisponível (Coordenadas não capturadas)</div>
                  )}
                  {lead.latitude && lead.longitude && (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Latitude: {lead.latitude} | Longitude: {lead.longitude}
                    </div>
                  )}
                </div>

                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ marginBottom: '12px' }}>Avaliações Google Maps</h3>
                  {lead.rating ? (
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '24px' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-warning)', display: 'block', lineHeight: 1 }}>
                          {lead.rating}
                        </span>
                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '6px' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < Math.floor(lead.rating) ? 'var(--color-warning)' : 'none'} 
                              stroke="var(--color-warning)" 
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                          Nota Geral
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', display: 'block', color: '#fff' }}>
                          {lead.reviews_count} avaliações de clientes
                        </span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Avaliações indicam satisfação dos clientes no espaço físico.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state-box">Nenhuma avaliação localizada.</div>
                  )}
                </div>
              </div>
            )}

            {/* AUDIT TAB */}
            {activeTab === 'audit' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Real Reviews List */}
                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Comentários de Clientes (Google Maps)</h3>
                  {lead.reviews && lead.reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {lead.reviews.map((rev, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{rev.author}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.date}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={10} 
                                fill={i < Math.floor(rev.rating) ? 'var(--color-warning)' : 'none'} 
                                stroke="var(--color-warning)" 
                              />
                            ))}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>"{rev.text}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-box">Nenhuma avaliação detalhada capturada.</div>
                  )}
                </div>

                {/* Photo Gallery Grid */}
                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Galeria de Fotos da Empresa</h3>
                  {lead.gallery && lead.gallery.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {lead.gallery.map((imgUrl, idx) => (
                        <div key={idx} style={{ borderRadius: '6px', overflow: 'hidden', height: '100px', border: '1px solid var(--border-color)' }}>
                          <img src={imgUrl} alt={`Galeria ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-box">Galeria de fotos não disponível.</div>
                  )}
                </div>

                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Auditoria Estrutural de Website</h3>
                  {lead.has_website === 1 ? (
                    <div className="audit-metrics-grid">
                      <div className="audit-metric-box">
                        <span className="metric-label">Segurança SSL (HTTPS)</span>
                        <span className={`metric-value ${websiteAnalysis.hasSsl ? 'good' : 'bad'}`}>
                          {websiteAnalysis.hasSsl ? 'Ativo (Seguro)' : 'Inativo (Perigo)'}
                        </span>
                      </div>
                      <div className="audit-metric-box">
                        <span className="metric-label">Velocidade de Carregamento</span>
                        <span className={`metric-value ${websiteAnalysis.speedScore >= 70 ? 'good' : 'warning'}`}>
                          {websiteAnalysis.loadTimeSeconds}s (Score {websiteAnalysis.speedScore}/100)
                        </span>
                      </div>
                      <div className="audit-metric-box">
                        <span className="metric-label">Responsividade Mobile</span>
                        <span className={`metric-value ${websiteAnalysis.mobileScore >= 50 ? 'good' : 'bad'}`}>
                          {websiteAnalysis.responsiveness} (Score {websiteAnalysis.mobileScore}/100)
                        </span>
                      </div>
                      <div className="audit-metric-box">
                        <span className="metric-label">Tags de Tráfego / Anúncios</span>
                        <span className="metric-value font-small">
                          GA: {websiteAnalysis.hasGoogleAnalytics ? '✅' : '❌'} | Pixel: {websiteAnalysis.hasFacebookPixel ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="audit-metric-box">
                        <span className="metric-label">Estrutura de Layout</span>
                        <span className="metric-value font-small">{websiteAnalysis.layoutQuality}</span>
                      </div>
                      <div className="audit-metric-box">
                        <span className="metric-label">Links Quebrados</span>
                        <span className={`metric-value ${websiteAnalysis.brokenLinksCount > 2 ? 'warning' : 'good'}`}>
                          {websiteAnalysis.brokenLinksCount} detectados
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                      <ShieldAlert size={20} />
                      <div>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>Empresa sem site próprio</strong>
                        O lead depende exclusivamente de redes sociais ou listagens locais. Recomendação imediata: Venda de Landing Page institucional integrada ao WhatsApp.
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Auditoria de Redes Sociais</h3>
                  <div className="audit-metrics-grid">
                    <div className="audit-metric-box">
                      <span className="metric-label">Presença no Instagram</span>
                      <span className="metric-value">{socialAnalysis.instagramStatus}</span>
                    </div>
                    <div className="audit-metric-box">
                      <span className="metric-label">Seguidores Estimados</span>
                      <span className="metric-value">{lead.followers || 'Desconhecido'}</span>
                    </div>
                    <div className="audit-metric-box">
                      <span className="metric-label">Frequência de Postagem</span>
                      <span className={`metric-value ${socialAnalysis.postFrequency === 'Inativa / Parada' ? 'bad' : 'good'}`}>
                        {socialAnalysis.postFrequency}
                      </span>
                    </div>
                    <div className="audit-metric-box">
                      <span className="metric-label">WhatsApp na Bio</span>
                      <span className={`metric-value ${socialAnalysis.hasWhatsappLink ? 'good' : 'warning'}`}>
                        {socialAnalysis.hasWhatsappLink ? 'Configurado' : 'Ausente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DIAGNOSIS TAB */}
            {activeTab === 'ai' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-header-mini" style={{ margin: 0 }}>Diagnóstico Gerado por IA</h3>
                    <button 
                      onClick={handleRegenerateReport} 
                      disabled={regenerating} 
                      className="btn-trigger-cron"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}
                    >
                      <RefreshCw size={12} className={regenerating ? 'spin' : ''} />
                      {regenerating ? 'Processando...' : 'Reanalisar IA'}
                    </button>
                  </div>

                  <div className="ai-report-markdown" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem', color: '#e4e4e7' }}>
                    {lead.ai_report || 'Clique no botão acima para rodar a análise de Inteligência Artificial.'}
                  </div>
                </div>
              </div>
            )}

            {/* PROSPECTING TAB */}
            {activeTab === 'prospecting' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card">
                  <h3 className="section-header-mini">Régua de Relacionamento Multicanais</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Abaixo você pode navegar pelas mensagens construídas pela IA para prospecção em diferentes canais de contato:
                  </p>

                  {/* Channel Select Tabs */}
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <button 
                      className={`details-tab-btn mini ${activeMessageChannel === 'whatsapp' ? 'active' : ''}`}
                      onClick={() => setActiveMessageChannel('whatsapp')}
                    >
                      WhatsApp
                    </button>
                    <button 
                      className={`details-tab-btn mini ${activeMessageChannel === 'email' ? 'active' : ''}`}
                      onClick={() => setActiveMessageChannel('email')}
                    >
                      E-mail
                    </button>
                    <button 
                      className={`details-tab-btn mini ${activeMessageChannel === 'instagram' ? 'active' : ''}`}
                      onClick={() => setActiveMessageChannel('instagram')}
                    >
                      Instagram Direct
                    </button>
                  </div>

                  {/* Stage Select Tabs */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <button 
                      className={`stage-select-btn ${activeMessageStage === 'firstContact' ? 'active' : ''}`}
                      onClick={() => setActiveMessageStage('firstContact')}
                    >
                      1º Contato (Abordagem)
                    </button>
                    <button 
                      className={`stage-select-btn ${activeMessageStage === 'secondContact' ? 'active' : ''}`}
                      onClick={() => setActiveMessageStage('secondContact')}
                    >
                      2º Contato (Lembrete)
                    </button>
                    <button 
                      className={`stage-select-btn ${activeMessageStage === 'followUp' ? 'active' : ''}`}
                      onClick={() => setActiveMessageStage('followUp')}
                    >
                      3º Contato (Follow-up)
                    </button>
                    <button 
                      className={`stage-select-btn ${activeMessageStage === 'lastAttempt' ? 'active' : ''}`}
                      onClick={() => setActiveMessageStage('lastAttempt')}
                    >
                      4º Contato (Despedida)
                    </button>
                  </div>

                  {/* Message editor area */}
                  <textarea 
                    className="message-textarea"
                    style={{ height: '180px', marginBottom: '12px' }}
                    value={editableMessage}
                    onChange={(e) => setEditableMessage(e.target.value)}
                  />

                  <div className="message-actions-row">
                    <button className="btn-channel" onClick={() => handleCopy(editableMessage, 'message_copied')}>
                      {copiedKey === 'message_copied' ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                      {copiedKey === 'message_copied' ? 'Copiado!' : 'Copiar Mensagem'}
                    </button>

                    <div className="message-send-channels">
                      {activeMessageChannel === 'whatsapp' && (
                        <button className="btn-channel whatsapp" onClick={() => handleSendMessage('whatsapp')}>
                          <Send size={14} /> Abrir WhatsApp Web
                        </button>
                      )}
                      {activeMessageChannel === 'email' && (
                        <button className="btn-channel email" onClick={() => handleSendMessage('email')}>
                          <Mail size={14} /> Disparar E-mail
                        </button>
                      )}
                      {activeMessageChannel === 'instagram' && (
                        <button className="btn-channel instagram" onClick={() => handleSendMessage('instagram')}>
                          <Instagram size={14} /> Enviar no Instagram
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow-up scheduler view */}
                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Timeline de Follow-ups Agendados</h3>
                  <div className="timeline-container">
                    {lead.followUps && lead.followUps.length > 0 ? (
                      lead.followUps.map((fu, index) => (
                        <div key={index} className={`timeline-event ${fu.status === 'Enviado' ? 'completed' : 'pending'}`}>
                          <div className="timeline-node"></div>
                          <div className="timeline-header">
                            <span className="timeline-day">Sequência D+{fu.sequence_day}</span>
                            <span className="timeline-status" style={{ color: fu.status === 'Enviado' ? 'var(--color-success)' : 'var(--accent-primary)' }}>
                              {fu.status === 'Enviado' 
                                ? 'Disparado ✅' 
                                : `Agendado: ${new Date(fu.scheduled_for).toLocaleDateString('pt-BR')} ${new Date(fu.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              }
                            </span>
                          </div>
                          <p className="timeline-msg">{fu.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state-box">Nenhuma sequência configurada.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROPOSAL TAB */}
            {activeTab === 'proposal' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card">
                  <h3 className="section-header-mini">Gerador SaaS de Propostas de Vendas</h3>
                  
                  {crmProposalSent && crmProposalText && (
                    <div style={{ display: 'flex', gap: '8px', padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-success)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px', alignItems: 'center' }}>
                      <Check size={16} />
                      <span>Uma proposta técnica já está ativa e salva no CRM para este cliente! Veja abaixo.</span>
                    </div>
                  )}

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Escolha os módulos comerciais que deseja propor para a **{lead.name}** para calcular a proposta técnica estruturada por IA:
                  </p>

                  <div className="services-select-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {[
                      'Criação de Website Institucional',
                      'Landing Page de Alta Conversão',
                      'Desenvolvimento de E-commerce',
                      'Design de Logotipo e Identidade Visual',
                      'Automação de WhatsApp (Chatbot inteligente)',
                      'Integração de Sistemas (CRM, Notion, Sheets)',
                      'Gestão e Otimização de SEO Local'
                    ].map((srv, idx) => {
                      const selected = proposalServices.includes(srv);
                      return (
                        <div 
                          key={idx} 
                          className={`service-select-item ${selected ? 'selected' : ''}`}
                          onClick={() => {
                            setProposalServices(prev => 
                              prev.includes(srv) ? prev.filter(s => s !== srv) : [...prev, srv]
                            );
                          }}
                          style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                        >
                          <input type="checkbox" checked={selected} readOnly style={{ pointerEvents: 'none' }} />
                          {srv}
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    className="btn-proposal-generate" 
                    onClick={handleGenerateProposal}
                    disabled={generatingProposal}
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <FileText size={16} />
                    {generatingProposal ? 'Gerando Proposta...' : 'Construir Proposta Comercial'}
                  </button>

                  {(proposalText || crmProposalText) && (
                    <div className="proposal-preview-box" style={{ whiteSpace: 'pre-wrap', marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                        <button 
                          className="btn-channel" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleCopy(proposalText || crmProposalText, 'proposal_copied')}
                        >
                          {copiedKey === 'proposal_copied' ? <Check size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} />}
                          Copiar Proposta
                        </button>
                      </div>
                      <div className="proposal-md" style={{ color: '#e4e4e7', fontSize: '0.85rem', lineHeight: '1.6' }}>
                        {proposalText || crmProposalText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COPILOT TAB */}
            {activeTab === 'copilot' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card">
                  <h3 className="section-header-mini" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Bot size={18} style={{ color: 'var(--accent-primary)' }} />
                    Copiloto Inteligente para Vendas
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Pergunte estratégias, contorne objeções de venda (ex: "já tenho site", "está caro") ou elabore cronogramas específicos.
                  </p>

                  <div className="chat-container" style={{ height: '350px' }}>
                    <div className="chat-history">
                      <div className="chat-msg assistant">
                        Olá! Sou seu copiloto de vendas para a **{lead.name}**. Posso simular réplicas comerciais, formatar mensagens customizadas ou criar planos de acompanhamento para essa empresa. Como posso te apoiar agora?
                      </div>
                      
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`chat-msg ${msg.sender}`}>
                          {msg.text}
                        </div>
                      ))}
                      
                      {chatLoading && (
                        <div className="chat-msg assistant" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span className="loader-spinner" style={{ width: '12px', height: '12px', borderThickness: '1px', margin: 0 }}></span>
                          Pensando...
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendChat} className="chat-input-bar">
                      <input 
                        type="text" 
                        placeholder="Escreva sua pergunta ou objeção do cliente..." 
                        className="chat-input"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={chatLoading}
                      />
                      <button type="submit" className="btn-send-chat" disabled={chatLoading || !chatMessage.trim()}>
                        <MessageSquare size={14} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* CRM HISTORY & INTERACTION LOGS TAB */}
            {activeTab === 'copilot' ? null : (
              <div className="glass-card" style={{ marginTop: '20px' }}>
                <h3 className="section-header-mini" style={{ marginBottom: '12px' }}>Histórico Completo de Interações</h3>
                
                {/* Event Logs Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
                  {crmHistory.length > 0 ? (
                    crmHistory.map((evt, idx) => (
                      <div key={idx} style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderLeft: '3px solid var(--accent-primary)', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '4px' }}>
                          <span>{new Date(evt.date).toLocaleString('pt-BR')}</span>
                          <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: evt.type === 'message_sent' ? 'var(--color-info)' : 'var(--color-success)' }}>
                            {evt.type === 'message_sent' ? 'Disparo' : (evt.type === 'proposal_sent' ? 'Proposta' : 'Nota Manual')}
                          </span>
                        </div>
                        <p style={{ color: '#e4e4e7', lineHeight: '1.4' }}>{evt.description}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '10px' }}>
                      Nenhum contato registrado no histórico ainda.
                    </p>
                  )}
                </div>

                {/* Add Custom Note Form */}
                <form onSubmit={handleAddHistoryLog} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Adicionar nota manual ao histórico comercial..." 
                    className="input-field-mini"
                    style={{ flexGrow: 1, height: '36px' }}
                    value={newHistoryText}
                    onChange={(e) => setNewHistoryText(e.target.value)}
                  />
                  <button type="submit" className="btn-trigger-cron" style={{ width: 'auto', padding: '0 12px', height: '36px' }} disabled={!newHistoryText.trim()}>
                    <PlusCircle size={16} style={{ marginRight: 0 }} />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
