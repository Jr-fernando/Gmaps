import React from 'react';
import Button from '../common/Button';

export default function ProposalBuilder({
  proposalServices,
  setProposalServices,
  proposalText,
  generatingProposal,
  handleGenerateProposal,
  handleCopy,
  copiedKey
}) {
  const serviceOptions = [
    { id: 'seo', name: 'Otimização de SEO Local (Google)', price: 'R$ 800 - R$ 1.500/mês' },
    { id: 'website', name: 'Desenvolvimento de Site Premium Responsivo', price: 'R$ 2.500 (Taxa única)' },
    { id: 'gmaps', name: 'Gestão de Ficha & Avaliações Google Maps', price: 'R$ 500/mês' },
    { id: 'automation', name: 'Implementação de CRM e Automação de WhatsApp', price: 'R$ 1.200 (Configuração)' }
  ];

  const toggleService = (id) => {
    setProposalServices(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="proposal-tab" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Selecione os serviços que deseja incluir na proposta comercial. A IA montará uma proposta estruturada baseada no diagnóstico de fraquezas da empresa.
      </p>

      <div className="services-select-list">
        {serviceOptions.map(srv => {
          const isSelected = proposalServices.includes(srv.id);
          return (
            <div 
              key={srv.id} 
              className={`service-select-item ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleService(srv.id)}
            >
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => {}} // Controlled by onClick
                style={{ cursor: 'pointer' }}
              />
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 600 }}>{srv.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Média: {srv.price}</div>
              </div>
            </div>
          );
        })}
      </div>

      <Button 
        variant="proposal"
        onClick={handleGenerateProposal}
        loading={generatingProposal}
        disabled={proposalServices.length === 0}
      >
        Gerar Proposta Comercial com IA
      </Button>

      {proposalText && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Proposta Comercial Gerada</span>
            <Button 
              variant="secondary" 
              onClick={() => handleCopy(proposalText, 'proposal')}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              {copiedKey === 'proposal' ? '✓ Copiado' : '📋 Copiar Proposta'}
            </Button>
          </div>
          <div className="proposal-preview-box">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
              {proposalText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
