import React, { useState, useEffect } from 'react';
import { Globe, Star, ShieldAlert, RefreshCw, Eye } from 'lucide-react';
import useLeadDetails from '../hooks/useLeadDetails';
import CompanyProfileCard from '../components/company/CompanyProfileCard';
import Timeline from '../components/company/Timeline';
import CopilotChat from '../components/company/CopilotChat';
import ProposalBuilder from '../components/company/ProposalBuilder';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { apiFetch } from '../services/api';

export default function CompanyDetailsPage({ leadId, onBack, onLeadUpdated }) {
  const [activeTab, setActiveTab] = useState('general');
  const [copiedKey, setCopiedKey] = useState('');
  
  // Custom message sequence states (only used in prospecting tab rendering)
  const [activeMessageChannel, setActiveMessageChannel] = useState('whatsapp');
  const [activeMessageStage, setActiveMessageStage] = useState('firstContact');
  const [editableMessage, setEditableMessage] = useState('');
  
  // Custom states for proposal services and copilot chat
  const [proposalServices, setProposalServices] = useState(['Criação de Website Institucional']);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newHistoryText, setNewHistoryText] = useState('');

  const {
    lead,
    loading,
    savingCrm,
    saveSuccess,
    regenerating,
    generatingProposal,
    
    // CRM States
    crmOwner, setCrmOwner,
    crmValue, setCrmValue,
    crmNextAction, setCrmNextAction,
    crmNotes, setCrmNotes,
    crmStatus, setCrmStatus,
    crmFirstContactDate, setCrmFirstContactDate,
    crmLastContactDate, setCrmLastContactDate,
    crmHistory,
    crmProposalText,
    crmProbability, setCrmProbability,
    crmNextContactDate, setCrmNextContactDate,
    
    // Operations
    saveCrm,
    addHistoryLog,
    sendMessage,
    regenerateReport,
    generateProposal
  } = useLeadDetails(leadId, onLeadUpdated);

  // Sync editable message when channel/stage tabs change or lead loads
  useEffect(() => {
    if (!lead) return;
    const msg = lead.prospectingMessages?.[activeMessageChannel]?.[activeMessageStage] 
      || (activeMessageStage === 'firstContact' ? lead.first_message : '') 
      || '';
    setEditableMessage(msg);
  }, [activeMessageChannel, activeMessageStage, lead]);

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      alert('Não foi possível copiar para a área de transferência.');
    }
  };

  const handleSaveCrmForm = (e) => {
    e.preventDefault();
    saveCrm();
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!newHistoryText.trim()) return;
    addHistoryLog(newHistoryText).then(success => {
      if (success) setNewHistoryText('');
    });
  };

  const handleSendProspectingMessage = async () => {
    const success = await sendMessage(activeMessageChannel, editableMessage);
    if (success) {
      if (activeMessageChannel === 'whatsapp' && lead.whatsapp) {
        const text = encodeURIComponent(editableMessage);
        window.open(`https://api.whatsapp.com/send?phone=${lead.whatsapp}&text=${text}`, '_blank');
      } else if (activeMessageChannel === 'email' && lead.email) {
        window.open(`mailto:${lead.email}?subject=${encodeURIComponent('Oportunidades de Presença Digital - ' + lead.name)}&body=${encodeURIComponent(editableMessage)}`, '_blank');
      } else {
        alert(`Disparo simulado via ${activeMessageChannel.toUpperCase()} concluído!`);
      }
    }
  };

  const handleBuildProposal = async () => {
    await generateProposal(proposalServices);
  };

  const handleSendChatToCopilot = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userMsg = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await apiFetch(`/api/leads/${lead.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage, history: chatHistory })
      });
      if (!response.ok) throw new Error('Copiloto fora do ar');
      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: 'assistant', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: 'assistant', text: 'Desculpe, ocorreu um erro na comunicação com o copiloto.' }]);
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

  if (!lead) {
    return <p style={{ color: 'var(--color-danger)' }}>Não foi possível carregar esta empresa.</p>;
  }

  const { website_analysis: websiteAnalysis = {} } = lead;

  const mapUrl = lead.latitude && lead.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lead.longitude - 0.003}%2C${lead.latitude - 0.002}%2C${lead.longitude + 0.003}%2C${lead.latitude + 0.002}&layer=mapnik&marker=${lead.latitude}%2C${lead.longitude}`
    : null;

  return (
    <div className="company-details-view animate-fade-in">
      {/* Header Bar */}
      <div className="details-header-bar">
        <Button variant="back" onClick={onBack}>
          ← Voltar para a Lista
        </Button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {lead.gmaps_link && (
            <a href={lead.gmaps_link} target="_blank" rel="noopener noreferrer" className="btn-channel border" style={{ textDecoration: 'none' }}>
              <Eye size={14} /> Abrir no Google Maps
            </a>
          )}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="btn-channel border" style={{ textDecoration: 'none' }}>
              <Globe size={14} /> Visitar Website
            </a>
          )}
        </div>
      </div>

      {/* Main Split Profile Layout */}
      <div className="profile-grid">
        
        {/* Left Column - Card Profile & CRM */}
        <CompanyProfileCard 
          lead={lead}
          crmOwner={crmOwner} setCrmOwner={setCrmOwner}
          crmValue={crmValue} setCrmValue={setCrmValue}
          crmNextAction={crmNextAction} setCrmNextAction={setCrmNextAction}
          crmNotes={crmNotes} setCrmNotes={setCrmNotes}
          crmStatus={crmStatus} setCrmStatus={setCrmStatus}
          crmFirstContactDate={crmFirstContactDate} setCrmFirstContactDate={setCrmFirstContactDate}
          crmLastContactDate={crmLastContactDate} setCrmLastContactDate={setCrmLastContactDate}
          crmProbability={crmProbability} setCrmProbability={setCrmProbability}
          crmNextContactDate={crmNextContactDate} setCrmNextContactDate={setCrmNextContactDate}
          savingCrm={savingCrm}
          saveSuccess={saveSuccess}
          saveCrm={handleSaveCrmForm}
          copiedKey={copiedKey}
          handleCopy={handleCopy}
        />

        {/* Right Column - Tabs View Details */}
        <div className="profile-right-col">
          {/* Navigation Tabs */}
          <div className="details-tabs-bar">
            <button type="button" className={`details-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
              Geral & Localização
            </button>
            <button type="button" className={`details-tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
              Auditoria Web
            </button>
            <button type="button" className={`details-tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
              Diagnóstico IA
            </button>
            <button type="button" className={`details-tab-btn ${activeTab === 'prospecting' ? 'active' : ''}`} onClick={() => setActiveTab('prospecting')}>
              Mensagens Customizadas
            </button>
            <button type="button" className={`details-tab-btn ${activeTab === 'proposal' ? 'active' : ''}`} onClick={() => setActiveTab('proposal')}>
              Proposta Comercial
            </button>
            <button type="button" className={`details-tab-btn ${activeTab === 'copilot' ? 'active' : ''}`} onClick={() => setActiveTab('copilot')}>
              Copiloto Comercial
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="details-tab-body">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Card>
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
                </Card>

                <Card>
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
                      </div>
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', display: 'block', color: '#fff' }}>
                          {lead.reviews_count} avaliações de clientes
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state-box">Nenhuma avaliação localizada.</div>
                  )}
                </Card>
              </div>
            )}

            {/* AUDIT TAB */}
            {activeTab === 'audit' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Card>
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Comentários de Clientes</h3>
                  {lead.reviews && lead.reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {lead.reviews.map((rev, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{rev.author}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.date}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>"{rev.text}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-box">Nenhuma avaliação detalhada capturada.</div>
                  )}
                </Card>

                <Card>
                  <h3 className="section-header-mini" style={{ marginBottom: '14px' }}>Auditoria Estrutural de Website</h3>
                  {lead.has_website === 1 ? (
                    <div className="audit-metrics-grid">
                      <div className="audit-metric-box">
                        <span className="metric-label">Segurança SSL (HTTPS)</span>
                        <span className={`metric-value ${websiteAnalysis.hasSsl ? 'good' : 'bad'}`}>
                          {websiteAnalysis.hasSsl ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="audit-metric-box">
                        <span className="metric-label">Velocidade</span>
                        <span className={`metric-value ${websiteAnalysis.speedScore >= 70 ? 'good' : 'warning'}`}>
                          {websiteAnalysis.loadTimeSeconds}s (Score {websiteAnalysis.speedScore}/100)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '8px', color: 'var(--color-danger)' }}>
                      <ShieldAlert size={20} />
                      <div>O lead não possui site oficial. Venda imediata de Landing Page sugerida.</div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* DIAGNOSIS TAB */}
            {activeTab === 'ai' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-header-mini" style={{ margin: 0 }}>Diagnóstico por IA</h3>
                    <Button 
                      onClick={regenerateReport} 
                      disabled={regenerating} 
                      icon={<RefreshCw size={12} className={regenerating ? 'spin' : ''} />}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      {regenerating ? 'Processando...' : 'Reanalisar IA'}
                    </Button>
                  </div>
                  <div className="ai-report-markdown" style={{ whiteSpace: 'pre-wrap' }}>
                    {lead.ai_report || 'Clique no botão acima para rodar a análise de Inteligência Artificial.'}
                  </div>
                </Card>
              </div>
            )}

            {/* PROSPECTING TAB */}
            {activeTab === 'prospecting' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Card>
                  <h3 className="section-header-mini">Régua de Relacionamento</h3>
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                    {['whatsapp', 'email', 'instagram'].map(ch => (
                      <button 
                        key={ch}
                        type="button" 
                        className={`details-tab-btn mini ${activeMessageChannel === ch ? 'active' : ''}`}
                        onClick={() => setActiveMessageChannel(ch)}
                      >
                        {ch.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'firstContact', label: '1º Contato' },
                      { key: 'secondContact', label: '2º Contato' },
                      { key: 'followUp', label: 'Follow-up' },
                      { key: 'lastAttempt', label: 'Despedida' }
                    ].map(stg => (
                      <button 
                        key={stg.key}
                        type="button" 
                        className={`stage-select-btn ${activeMessageStage === stg.key ? 'active' : ''}`}
                        onClick={() => setActiveMessageStage(stg.key)}
                      >
                        {stg.label}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    className="message-textarea"
                    value={editableMessage}
                    onChange={(e) => setEditableMessage(e.target.value)}
                  />

                  <div className="message-actions-row">
                    <Button variant="secondary" onClick={() => handleCopy(editableMessage, 'message_copied')}>
                      {copiedKey === 'message_copied' ? '✓ Copiado!' : '📋 Copiar Mensagem'}
                    </Button>
                    <Button variant="primary" onClick={handleSendProspectingMessage}>
                      Disparar Canal
                    </Button>
                  </div>
                </Card>

                {/* Follow Ups timeline */}
                <Timeline 
                  crmHistory={crmHistory}
                  followUps={lead.followUps || []}
                  newHistoryText={newHistoryText}
                  setNewHistoryText={setNewHistoryText}
                  handleAddHistoryLog={handleSaveNote}
                />
              </div>
            )}

            {/* PROPOSAL TAB */}
            {activeTab === 'proposal' && (
              <Card className="animate-fade-in">
                <ProposalBuilder 
                  proposalServices={proposalServices}
                  setProposalServices={setProposalServices}
                  proposalText={crmProposalText}
                  generatingProposal={generatingProposal}
                  handleGenerateProposal={handleBuildProposal}
                  handleCopy={handleCopy}
                  copiedKey={copiedKey}
                />
              </Card>
            )}

            {/* COPILOT TAB */}
            {activeTab === 'copilot' && (
              <Card className="animate-fade-in">
                <CopilotChat 
                  chatMessage={chatMessage}
                  setChatMessage={setChatMessage}
                  chatHistory={chatHistory}
                  chatLoading={chatLoading}
                  handleSendChat={handleSendChatToCopilot}
                />
              </Card>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
