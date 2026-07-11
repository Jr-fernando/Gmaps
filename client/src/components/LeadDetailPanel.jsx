import React, { useEffect, useState } from 'react';
import { 
  X, Globe, Phone, Mail, MapPin, Instagram, Facebook, Star, 
  Send, ShieldAlert, Award, FileText, Bot, RefreshCw, MessageSquare, Copy, Check 
} from 'lucide-react';

const STATUS_OPTIONS = [
  'Novo Lead', 'Entrar em contato', 'Mensagem enviada', 'Respondeu', 
  'Negociação', 'Proposta enviada', 'Cliente', 'Perdido'
];

const AVAILABLE_SERVICES = [
  'Criação de Website Institucional',
  'Landing Page de Alta Conversão',
  'Desenvolvimento de E-commerce',
  'Design de Logotipo e Identidade Visual',
  'Automação de WhatsApp (Chatbot inteligente)',
  'Integração de Sistemas (CRM, Notion, Sheets)',
  'Gestão e Otimização de SEO Local'
];

export default function LeadDetailPanel({ leadId, onClose, onLeadUpdated }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  
  // States for actions
  const [editableMessage, setEditableMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedServices, setSelectedServices] = useState([AVAILABLE_SERVICES[0]]);
  const [proposal, setProposal] = useState('');
  const [generatingProposal, setGeneratingProposal] = useState(false);
  
  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    setChatHistory([]);
    fetch(`/api/leads/${leadId}`)
      .then(res => res.json())
      .then(data => {
        setLead(data);
        setEditableMessage(data.first_message || '');
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar detalhes do lead:', err);
        setLoading(false);
      });
  }, [leadId]);

  const handleStatusChange = async (newStatus) => {
    try {
      await fetch(`/api/leads/${lead.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setLead(prev => ({ ...prev, status: newStatus }));
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(editableMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (channel) => {
    try {
      await fetch(`/api/leads/${lead.id}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editableMessage, channel })
      });
      
      // Update status locally
      setLead(prev => ({ ...prev, status: 'Mensagem enviada' }));
      if (onLeadUpdated) onLeadUpdated();

      // Open window for WhatsApp Web if whatsapp selected
      if (channel === 'whatsapp' && lead.whatsapp) {
        const text = encodeURIComponent(editableMessage);
        window.open(`https://api.whatsapp.com/send?phone=${lead.whatsapp}&text=${text}`, '_blank');
      } else if (channel === 'email' && lead.email) {
        window.open(`mailto:${lead.email}?subject=${encodeURIComponent('Oportunidades de Presença Digital - ' + lead.name)}&body=${encodeURIComponent(editableMessage)}`, '_blank');
      } else {
        alert(`Disparo simulado via ${channel.toUpperCase()} executado com sucesso!`);
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
      setLead(prev => ({ ...prev, ai_report: data.ai_report, first_message: data.first_message }));
      setEditableMessage(data.first_message);
    } catch (err) {
      console.error('Erro ao regenerar relatório:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleService = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleGenerateProposal = async () => {
    setGeneratingProposal(true);
    setProposal('');
    try {
      const response = await fetch(`/api/leads/${lead.id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: selectedServices })
      });
      const data = await response.json();
      setProposal(data.proposal);
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
      <div className="drawer-backdrop" onClick={onClose}>
        <div className="drawer-panel" onClick={e => e.stopPropagation()} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="loader-spinner"></div>
        </div>
      </div>
    );
  }

  // Parse details
  const { websiteAnalysis, socialAnalysis } = lead;
  
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

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-area">
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
              {lead.segment}
            </span>
            <h3 className="drawer-title">{lead.name}</h3>
            <span className="drawer-subtitle">{lead.city}, {lead.state}</span>
          </div>
          
          <button className="btn-close-drawer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status selector */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifySpace: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status do CRM:</span>
          <select 
            value={lead.status} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="filter-select"
            style={{ width: '180px' }}
          >
            {STATUS_OPTIONS.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Tabs Bar */}
        <div className="drawer-tabs">
          <button 
            className={`drawer-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Resumo
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Auditoria Digital
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            Diagnóstico IA
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            Mensagens & Follow-up
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'proposal' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposal')}
          >
            Proposta
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'copilot' ? 'active' : ''}`}
            onClick={() => setActiveTab('copilot')}
          >
            Copiloto IA
          </button>
        </div>

        {/* Tab Contents */}
        <div className="drawer-content">
          
          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="details-list">
              <div className="presence-score-badge">
                <div className={`score-circle ${scoreColor}`}>{lead.opportunity_score}</div>
                <div className="score-text-details">
                  <h4 style={{ color: '#fff' }}>Score de Oportunidade</h4>
                  <p>{scoreText} • Potencial comercial elevado para captação local.</p>
                </div>
              </div>

              <div className="detail-item">
                <label>Descrição</label>
                <span>{lead.description || 'Nenhuma descrição fornecida.'}</span>
              </div>

              <div className="detail-item-row">
                <div className="detail-item">
                  <label>Telefone</label>
                  <span><Phone size={12} /> {lead.phone || 'Nenhum'}</span>
                </div>
                <div className="detail-item">
                  <label>WhatsApp</label>
                  <span>{lead.whatsapp ? `+${lead.whatsapp}` : 'Nenhum'}</span>
                </div>
              </div>

              <div className="detail-item-row">
                <div className="detail-item">
                  <label>E-mail</label>
                  <span><Mail size={12} /> {lead.email || 'Nenhum'}</span>
                </div>
                <div className="detail-item">
                  <label>Website</label>
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer">
                      <Globe size={12} /> {lead.website}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--color-danger)' }}>Sem site</span>
                  )}
                </div>
              </div>

              <div className="detail-item-row">
                <div className="detail-item">
                  <label>Instagram</label>
                  {lead.instagram_link ? (
                    <a href={lead.instagram_link} target="_blank" rel="noopener noreferrer">
                      <Instagram size={12} /> {lead.instagram}
                    </a>
                  ) : (
                    <span>{lead.instagram || 'Nenhum'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Facebook</label>
                  {lead.facebook ? (
                    <a href={lead.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook size={12} /> Link
                    </a>
                  ) : (
                    <span>Nenhum</span>
                  )}
                </div>
              </div>

              <div className="detail-item">
                <label>Endereço Completo</label>
                <span><MapPin size={12} /> {lead.address || 'Nenhum'}</span>
              </div>

              {lead.rating > 0 && (
                <div className="detail-item">
                  <label>Avaliações no Google</label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} fill="var(--color-warning)" stroke="none" />
                    <strong>{lead.rating}</strong> ({lead.reviews_count} opiniões)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div>
              <h3 className="section-header">Auditoria Digital Completa</h3>
              
              {/* Website Audit */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
                  Auditoria do Website
                </h4>
                {lead.has_website === 1 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Status SSL (HTTPS):</span>
                      <span style={{ color: websiteAnalysis.hasSsl ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                        {websiteAnalysis.hasSsl ? 'Seguro' : 'Não Seguro'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tempo de Carregamento:</span>
                      <span style={{ color: websiteAnalysis.speedScore > 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {websiteAnalysis.loadTimeSeconds}s (Score {websiteAnalysis.speedScore}/100)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Responsividade Mobile:</span>
                      <span style={{ color: websiteAnalysis.mobileScore > 50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {websiteAnalysis.responsiveness}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Google Analytics / Meta Pixel:</span>
                      <span>
                        {websiteAnalysis.hasGoogleAnalytics ? 'GA ✅' : 'GA ❌'} | {websiteAnalysis.hasFacebookPixel ? 'Pixel ✅' : 'Pixel ❌'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Qualidade Layout / Links Quebrados:</span>
                      <span>
                        {websiteAnalysis.layoutQuality} ({websiteAnalysis.brokenLinksCount} quebrados)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                    <ShieldAlert size={16} />
                    A empresa não possui website. Marcar como "Alta Oportunidade" para venda de site/landing page.
                  </div>
                )}
              </div>

              {/* Social Media Audit */}
              <div>
                <h4 style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
                  Auditoria de Redes Sociais
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Instagram Status:</span>
                    <span>{socialAnalysis.instagramStatus}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Seguidores:</span>
                    <span>{lead.followers > 0 ? `${lead.followers} seguidores` : 'Não localizado'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Frequência de Postagem:</span>
                    <span style={{ color: socialAnalysis.postFrequency === 'Inativa / Parada' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                      {socialAnalysis.postFrequency}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>WhatsApp na Bio / Link de Contato:</span>
                    <span>
                      {socialAnalysis.hasWhatsappLink ? 'Presente ✅' : 'Faltando ❌'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Combined issues list */}
              <div style={{ marginTop: '24px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gargalos Críticos a Apresentar:</span>
                <div className="issues-checklist">
                  {[...(websiteAnalysis.issues || []), ...(socialAnalysis.issues || [])].map((iss, index) => (
                    <div className="issue-check-item" key={index}>
                      <ShieldAlert size={14} className="issue-check-icon" />
                      <span>{iss}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* AI DIAGNOSIS TAB */}
          {activeTab === 'ai' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="section-header" style={{ margin: 0 }}>Relatório Inteligente da IA</h3>
                <button 
                  onClick={handleRegenerateReport} 
                  disabled={regenerating} 
                  className="btn-trigger-cron"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <RefreshCw size={12} className={regenerating ? 'spin' : ''} />
                  {regenerating ? 'Processando...' : 'Reanalisar'}
                </button>
              </div>

              <div className="ai-report-markdown" style={{ whiteSpace: 'pre-wrap' }}>
                {lead.ai_report}
              </div>
            </div>
          )}

          {/* ACTIONS AND MESSAGES TAB */}
          {activeTab === 'actions' && (
            <div>
              <h3 className="section-header">Abordagem Personalizada</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                A IA construiu essa mensagem citando fatos reais do negócio (ex: boas avaliações, falta de site ou erros identificados) para engajar e fechar reuniões.
              </p>

              <textarea 
                className="message-textarea"
                value={editableMessage}
                onChange={(e) => setEditableMessage(e.target.value)}
              ></textarea>

              <div className="message-actions-row">
                <button className="btn-channel" onClick={handleCopyMessage}>
                  {copied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>

                <div className="message-send-channels">
                  <button className="btn-channel whatsapp" onClick={() => handleSendMessage('whatsapp')}>
                    <Send size={14} /> WhatsApp Web
                  </button>
                  <button className="btn-channel email" onClick={() => handleSendMessage('email')}>
                    <Mail size={14} /> Enviar E-mail
                  </button>
                </div>
              </div>

              {/* Follow-up timeline */}
              <div>
                <h4 className="timeline-title">Linha de Follow-up (Cobrança Automática)</h4>
                <div className="timeline-container">
                  {lead.followUps && lead.followUps.map((fu, index) => (
                    <div key={index} className={`timeline-event ${fu.status === 'Enviado' ? 'completed' : 'pending'}`}>
                      <div className="timeline-node"></div>
                      <div className="timeline-header">
                        <span className="timeline-day">D+{fu.sequence_day}</span>
                        <span className="timeline-status" style={{ color: fu.status === 'Enviado' ? 'var(--color-success)' : 'var(--accent-primary)' }}>
                          {fu.status === 'Enviado' ? 'Enviado' : `Agendado para: ${new Date(fu.scheduled_for).toLocaleDateString('pt-BR')} ${new Date(fu.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                      <p className="timeline-msg">{fu.message}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* PROPOSAL TAB */}
          {activeTab === 'proposal' && (
            <div>
              <h3 className="section-header">Gerador de Propostas</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Selecione os serviços que deseja orçar para a **{lead.name}** e gere um escopo com estimativas de mercado reais.
              </p>

              <div className="services-select-list">
                {AVAILABLE_SERVICES.map((srv, idx) => {
                  const selected = selectedServices.includes(srv);
                  return (
                    <div 
                      key={idx} 
                      className={`service-select-item ${selected ? 'selected' : ''}`}
                      onClick={() => handleToggleService(srv)}
                    >
                      <input 
                        type="checkbox" 
                        checked={selected} 
                        onChange={() => {}} 
                        style={{ marginRight: '8px' }} 
                      />
                      {srv}
                    </div>
                  );
                })}
              </div>

              <button 
                className="btn-proposal-generate" 
                onClick={handleGenerateProposal}
                disabled={generatingProposal}
              >
                <FileText size={16} />
                {generatingProposal ? 'Gerando proposta comercial...' : 'Gerar Proposta Comercial'}
              </button>

              {proposal && (
                <div className="proposal-preview-box" style={{ whiteSpace: 'pre-wrap' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button 
                      className="btn-channel" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => {
                        navigator.clipboard.writeText(proposal);
                        alert('Proposta copiada para a área de transferência!');
                      }}
                    >
                      <Copy size={12} /> Copiar Proposta
                    </button>
                  </div>
                  {proposal}
                </div>
              )}
            </div>
          )}

          {/* COPILOT TAB */}
          {activeTab === 'copilot' && (
            <div>
              <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={20} style={{ color: 'var(--accent-primary)' }} />
                Copiloto de Vendas
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Converse com a IA para customizar a estratégia deste lead, simular respostas de objeções ou orçar demandas.
              </p>

              <div className="chat-container">
                <div className="chat-history">
                  <div className="chat-msg assistant">
                    Olá! Sou o seu copiloto inteligente para prospecção da **{lead.name}**. Posso reescrever mensagens de abordagem, criar uma réplica caso o cliente diga "já tenho site", ou detalhar um cronograma técnico. Como posso ajudar?
                  </div>
                  
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-msg ${msg.sender}`}>
                      {msg.text}
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="chat-msg assistant" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="loader-spinner" style={{ width: '12px', height: '12px', borderThickness: '1px', margin: 0 }}></span>
                      Pensando...
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendChat} className="chat-input-bar">
                  <input 
                    type="text" 
                    placeholder="Digite sua dúvida ou instrução..." 
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
          )}

        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Cadastrado em: {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </span>
          <button className="btn-channel" onClick={onClose}>
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
}
