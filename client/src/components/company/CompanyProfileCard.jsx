import React from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

export default function CompanyProfileCard({
  lead,
  crmOwner, setCrmOwner,
  crmValue, setCrmValue,
  crmNextAction, setCrmNextAction,
  crmNotes, setCrmNotes,
  crmStatus, setCrmStatus,
  crmProbability, setCrmProbability,
  crmNextContactDate, setCrmNextContactDate,
  savingCrm,
  saveSuccess,
  saveCrm,
  copiedKey,
  handleCopy
}) {
  const getScoreClass = (score) => {
    if (score >= 70) return 'good';
    if (score >= 40) return 'moderate';
    return 'critical';
  };

  return (
    <div className="profile-left-col">
      <Card className="profile-main-card">
        <span className="profile-segment-badge">{lead.segment}</span>
        <h2 className="profile-company-name">{lead.name}</h2>
        <p className="profile-company-category">{lead.city} - {lead.state}</p>

        <div className="presence-score-badge">
          <div className={`score-circle ${getScoreClass(lead.opportunity_score)}`}>
            {lead.opportunity_score}
          </div>
          <div className="score-text-details">
            <span className="score-title">Score de Oportunidade</span>
            <span className="score-subtitle">
              {lead.opportunity_score >= 70 ? 'Crítico (Precisa de IA)' : lead.opportunity_score >= 40 ? 'Moderado' : 'Bom (Presença OK)'}
            </span>
          </div>
        </div>

        <div className="quick-contacts-list">
          <div className="contact-row">
            <span>📞</span>
            <span style={{ flexGrow: 1 }}>{lead.phone || 'Sem telefone'}</span>
            {lead.phone && (
              <button className="btn-copy-mini" onClick={() => handleCopy(lead.phone, 'phone')}>
                {copiedKey === 'phone' ? '✓' : '📋'}
              </button>
            )}
          </div>
          <div className="contact-row">
            <span className="contact-icon green">💬</span>
            <span style={{ flexGrow: 1 }}>{lead.whatsapp || 'Sem WhatsApp'}</span>
            {lead.whatsapp && (
              <button className="btn-copy-mini" onClick={() => handleCopy(lead.whatsapp, 'whatsapp')}>
                {copiedKey === 'whatsapp' ? '✓' : '📋'}
              </button>
            )}
          </div>
          <div className="contact-row">
            <span>🌐</span>
            <span style={{ flexGrow: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                  {lead.website.replace('https://', '').replace('http://', '').split('/')[0]}
                </a>
              ) : 'Sem site'}
            </span>
          </div>
        </div>

        <div className="social-connectors-row">
          {lead.instagram ? (
            <a href={lead.instagram_link || `https://instagram.com/${lead.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="social-pill instagram">
              Instagram
            </a>
          ) : (
            <span className="social-pill disabled">Instagram</span>
          )}
          {lead.facebook ? (
            <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="social-pill facebook">
              Facebook
            </a>
          ) : (
            <span className="social-pill disabled">Facebook</span>
          )}
        </div>
      </Card>

      <Card className="CRM-form-card">
        <h3 className="section-header-mini">Status e Negociação</h3>
        <form onSubmit={saveCrm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input 
            mini
            select
            label="Responsável (Owner)"
            value={crmOwner}
            onChange={(e) => setCrmOwner(e.target.value)}
            options={[
              { value: '', label: 'Sem responsável' },
              { value: 'Fernando', label: 'Fernando' },
              { value: 'Vendas 01', label: 'Vendas 01' },
              { value: 'Automação IA', label: 'Automação IA' }
            ]}
          />
          <Input 
            mini
            select
            label="Etapa do CRM (Status)"
            value={crmStatus}
            onChange={(e) => setCrmStatus(e.target.value)}
            options={[
              { value: 'Novo Lead', label: 'Novo Lead' },
              { value: 'Entrar em contato', label: 'Entrar em contato' },
              { value: 'Mensagem enviada', label: 'Mensagem Enviada' },
              { value: 'Respondeu', label: 'Respondeu' },
              { value: 'Negociação', label: 'Negociação' },
              { value: 'Proposta enviada', label: 'Proposta enviada' },
              { value: 'Cliente', label: 'Cliente (Ganho)' },
              { value: 'Perdido', label: 'Perdido' }
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input 
              mini
              type="number"
              label="Valor Negociado (R$)"
              value={crmValue}
              onChange={(e) => setCrmValue(e.target.value)}
              placeholder="0.00"
            />
            <Input 
              mini
              type="number"
              label="Probabilidade (%)"
              value={crmProbability}
              onChange={(e) => setCrmProbability(e.target.value)}
              placeholder="50"
            />
          </div>
          <Input 
            mini
            type="text"
            label="Próxima Ação"
            value={crmNextAction}
            onChange={(e) => setCrmNextAction(e.target.value)}
            placeholder="Ex: Ligar amanhã"
          />
          <Input 
            mini
            type="date"
            label="Data Próximo Contato"
            value={crmNextContactDate}
            onChange={(e) => setCrmNextContactDate(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input 
              mini
              type="text"
              label="Primeiro Contato"
              value={crmFirstContactDate ? new Date(crmFirstContactDate).toLocaleDateString('pt-BR') : '-'}
              disabled
            />
            <Input 
              mini
              type="text"
              label="Último Contato"
              value={crmLastContactDate ? new Date(crmLastContactDate).toLocaleDateString('pt-BR') : '-'}
              disabled
            />
          </div>
          <Input 
            mini
            textarea
            label="Notas Internas"
            value={crmNotes}
            onChange={(e) => setCrmNotes(e.target.value)}
            placeholder="Notas sobre a negociação..."
            style={{ height: '70px' }}
          />

          <Button 
            variant="save" 
            type="submit" 
            loading={savingCrm} 
            style={{ width: '100%', marginTop: '4px' }}
          >
            {saveSuccess ? '✓ Salvo!' : 'Salvar Negociação'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
