import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, ExternalLink, Globe, MailCheck, MailQuestion, MapPin, Search, Star } from 'lucide-react';
import useLeads from '../hooks/useLeads';
import Card from '../components/common/Card';
import { searchService } from '../services/api';

const isSent = (lead) => !['Novo Lead', 'Entrar em contato'].includes(lead.status || 'Novo Lead');

export default function CompaniesPage({ onSelectLead, refreshTrigger }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [segment, setSegment] = useState('');
  const [searchId, setSearchId] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
  const [savedSearches, setSavedSearches] = useState([]);
  const { leads, loading, cities, segments, updateLeadStatus } = useLeads({}, refreshTrigger);
  useEffect(() => { searchService.getSaved().then(setSavedSearches).catch(() => setSavedSearches([])); }, [refreshTrigger]);
  const selectedSearchIds = useMemo(() => {
    if (!searchId) return null;
    const selected = savedSearches.find((item) => String(item.id) === searchId);
    return new Set((selected?.leadIds || []).map(String));
  }, [savedSearches, searchId]);
  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    const haystack = `${lead.name || ''} ${lead.description || ''} ${lead.category || ''} ${lead.segment || ''}`.toLocaleLowerCase('pt-BR');
    if (term && !haystack.includes(term)) return false;
    if (city && lead.city !== city) return false;
    if (segment && lead.segment !== segment && lead.category !== segment) return false;
    if (selectedSearchIds && !selectedSearchIds.has(String(lead.id))) return false;
    return true;
  }), [leads, query, city, segment, selectedSearchIds]);
  const summary = useMemo(() => ({
    total: filteredLeads.length,
    sent: filteredLeads.filter(isSent).length,
    pending: filteredLeads.filter((lead) => !isSent(lead)).length,
  }), [filteredLeads]);
  const visibleLeads = useMemo(() => filteredLeads.filter((lead) => contactFilter === 'all' || (contactFilter === 'sent' ? isSent(lead) : !isSent(lead))), [filteredLeads, contactFilter]);
  const toggleSent = async (lead) => updateLeadStatus(lead.id, isSent(lead) ? 'Novo Lead' : 'Mensagem enviada');
  const openLead = (leadId) => onSelectLead(leadId);

  return (
    <div className="animate-fade-in">
      <div className="company-directory-header">
        <div>
          <h3>Base de empresas</h3>
          <p>Todos os estabelecimentos capturados, prontos para analisar ou mover no CRM.</p>
        </div>
        <span className="directory-count">{summary.total} empresa{summary.total === 1 ? '' : 's'}</span>
      </div>

      <div className="contact-summary-grid">
        <button type="button" className={contactFilter === 'all' ? 'active' : ''} onClick={() => setContactFilter('all')}><Building2 size={17} /><span><small>Total salvo</small><strong>{summary.total}</strong></span></button>
        <button type="button" className={contactFilter === 'pending' ? 'active' : ''} onClick={() => setContactFilter('pending')}><MailQuestion size={17} /><span><small>Não enviados</small><strong>{summary.pending}</strong></span></button>
        <button type="button" className={contactFilter === 'sent' ? 'active' : ''} onClick={() => setContactFilter('sent')}><MailCheck size={17} /><span><small>Já enviados</small><strong>{summary.sent}</strong></span></button>
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
        <select value={segment} onChange={(event) => setSegment(event.target.value)} aria-label="Filtrar por nicho">
          <option value="">Todos os nichos</option>
          {segments.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={searchId} onChange={(event) => setSearchId(event.target.value)} aria-label="Filtrar por busca de origem">
          <option value="">Todas as buscas</option>
          {savedSearches.map((item) => <option key={item.id} value={item.id}>{item.query} · {item.city} · {item.found}/{item.requested}</option>)}
        </select>
      </Card>

      {loading ? <p className="directory-empty">Carregando empresas...</p> : visibleLeads.length === 0 ? (
        <p className="directory-empty">Nenhuma empresa encontrada. Faça uma busca ativa para alimentar a base.</p>
      ) : (
        <div className="company-directory-grid">
          {visibleLeads.map((lead) => (
            <article className="company-directory-card" key={lead.id} onClick={() => openLead(lead.id)}>
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
                <button type="button" onClick={(event) => { event.stopPropagation(); openLead(lead.id); }}>Ver perfil <ExternalLink size={14} /></button>
              </div>
              <button type="button" className={`sent-toggle ${isSent(lead) ? 'sent' : ''}`} onClick={(event) => { event.stopPropagation(); toggleSent(lead); }}><CheckCircle2 size={14} />{isSent(lead) ? 'Contato enviado' : 'Marcar como enviado'}</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
