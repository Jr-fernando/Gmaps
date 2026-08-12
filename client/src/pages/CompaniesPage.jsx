import React, { useMemo, useState } from 'react';
import { Building2, ExternalLink, Globe, MapPin, Search, Star } from 'lucide-react';
import useLeads from '../hooks/useLeads';
import Card from '../components/common/Card';

export default function CompaniesPage({ onSelectLead, refreshTrigger }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const filters = useMemo(() => ({ query, city }), [query, city]);
  const { leads, loading, cities } = useLeads(filters, refreshTrigger);

  return (
    <div className="animate-fade-in">
      <div className="company-directory-header">
        <div>
          <h3>Base de empresas</h3>
          <p>Todos os estabelecimentos capturados, prontos para analisar ou mover no CRM.</p>
        </div>
        <span className="directory-count">{leads.length} empresa{leads.length === 1 ? '' : 's'}</span>
      </div>

      <Card className="directory-filters">
        <div className="directory-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa ou descrição" aria-label="Buscar empresas" />
        </div>
        <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filtrar por cidade">
          <option value="">Todas as cidades</option>
          {cities.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </Card>

      {loading ? <p className="directory-empty">Carregando empresas...</p> : leads.length === 0 ? (
        <p className="directory-empty">Nenhuma empresa encontrada. Faça uma busca ativa para alimentar a base.</p>
      ) : (
        <div className="company-directory-grid">
          {leads.map((lead) => (
            <button className="company-directory-card" key={lead.id} type="button" onClick={() => onSelectLead(lead.id)}>
              <div className="company-directory-card-top">
                <span className="company-directory-icon"><Building2 size={18} /></span>
                <span className={`score-pill ${lead.opportunity_score >= 80 ? 'high' : ''}`}>{lead.opportunity_score || 0}/100</span>
              </div>
              <strong>{lead.name}</strong>
              <span className="company-directory-category">{lead.category || lead.segment || 'Empresa local'}</span>
              <span className="company-directory-detail"><MapPin size={14} />{lead.city || 'Localização não informada'}</span>
              <span className="company-directory-detail"><Star size={14} />{lead.rating ? `${lead.rating} (${lead.reviews_count || 0} avaliações)` : 'Sem avaliações'}</span>
              <div className="company-directory-card-footer">
                {lead.website ? <span><Globe size={14} /> Site</span> : <span>Sem site</span>}
                <span>Ver perfil <ExternalLink size={14} /></span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
