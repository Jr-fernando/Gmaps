import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Globe, Star, Filter, RefreshCw, Trash, LayoutGrid, List } from 'lucide-react';

const COLUMNS = [
  { id: 'Novo Lead', title: 'Novo Lead', color: 'var(--accent-primary)' },
  { id: 'Entrar em contato', title: 'Entrar em Contato', color: 'var(--color-info)' },
  { id: 'Mensagem enviada', title: 'Mensagem Enviada', color: 'var(--accent-secondary)' },
  { id: 'Respondeu', title: 'Respondeu', color: 'var(--color-warning)' },
  { id: 'Negociação', title: 'Negociação', color: '#ff7a00' },
  { id: 'Proposta enviada', title: 'Proposta Enviada', color: '#ec4899' },
  { id: 'Cliente', title: 'Cliente Fechado', color: 'var(--color-success)' },
  { id: 'Perdido', title: 'Perdido', color: 'var(--text-muted)' }
];

export default function CRMBoardPage({ onSelectLead, refreshTrigger }) {
  const [leads, setLeads] = useState([]);
  const [cities, setCities] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterSegment, setFilterSegment] = useState('');
  const [filterWebsite, setFilterWebsite] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [filterInstagram, setFilterInstagram] = useState('');
  const [filterFacebook, setFilterFacebook] = useState('');
  const [filterWhatsapp, setFilterWhatsapp] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterReviews, setFilterReviews] = useState('');

  const fetchLeads = useCallback(() => {
    setLoading(true);
    let url = `/api/leads?`;
    if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;
    if (filterCity) url += `city=${encodeURIComponent(filterCity)}&`;
    if (filterState) url += `state=${encodeURIComponent(filterState)}&`;
    if (filterSegment) url += `segment=${encodeURIComponent(filterSegment)}&`;
    if (filterWebsite !== '') url += `has_website=${filterWebsite}&`;
    if (filterScore) url += `min_score=${filterScore}&`;
    if (filterInstagram !== '') url += `instagram=${filterInstagram}&`;
    if (filterFacebook !== '') url += `facebook=${filterFacebook}&`;
    if (filterWhatsapp !== '') url += `whatsapp=${filterWhatsapp}&`;
    if (filterPhone !== '') url += `phone=${filterPhone}&`;
    if (filterRating) url += `min_rating=${filterRating}&`;
    if (filterReviews) url += `min_reviews=${filterReviews}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        // Extract unique cities and segments for filter dropdowns if not set
        if (cities.length === 0) {
          const uniqueCities = [...new Set(data.map(l => l.city))].filter(Boolean);
          setCities(uniqueCities);
        }
        if (segments.length === 0) {
          const uniqueSegments = [...new Set(data.map(l => l.segment))].filter(Boolean);
          setSegments(uniqueSegments);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar leads:', err);
        setLoading(false);
      });
  }, [
    searchQuery, filterCity, filterState, filterSegment, filterWebsite, filterScore,
    filterInstagram, filterFacebook, filterWhatsapp, filterPhone, filterRating, filterReviews,
    cities.length, segments.length
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshTrigger]);

  // Drag & Drop handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id.toString() === leadId ? { ...l, status: targetStatus } : l));

    try {
      await fetch(`/api/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
    } catch (err) {
      console.error('Falha ao atualizar status do lead via drag & drop:', err);
      fetchLeads(); // roll back
    }
  };

  const handleDeleteLead = async (e, leadId) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja deletar este lead permanentemente?')) return;
    
    try {
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      fetchLeads();
    } catch (err) {
      console.error('Erro ao deletar lead:', err);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCity('');
    setFilterState('');
    setFilterSegment('');
    setFilterWebsite('');
    setFilterScore('');
    setFilterInstagram('');
    setFilterFacebook('');
    setFilterWhatsapp('');
    setFilterPhone('');
    setFilterRating('');
    setFilterReviews('');
  };

  // Group leads by status
  const leadsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(l => l.status === col.id);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Advanced Filters Panel */}
      <div className="glass-card animate-fade-in" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Filter size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Painel de Filtros Avançados de Prospecção</span>
          </div>
          
          {/* Switcher Toggle */}
          <div className="view-mode-toggle" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button 
              type="button"
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none', 
                background: viewMode === 'kanban' ? 'var(--accent-primary)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button 
              type="button"
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none', 
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <List size={14} /> Lista
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {/* Text Search */}
          <input
            type="text"
            placeholder="Buscar por nome..."
            className="filter-select"
            style={{ width: '100%', border: '1px solid var(--border-color)' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* City */}
          <select className="filter-select" value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
            <option value="">Todas as Cidades</option>
            {cities.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>

          {/* State */}
          <input
            type="text"
            placeholder="Filtrar por Estado (Ex: SP)"
            className="filter-select"
            style={{ width: '100%', textTransform: 'uppercase' }}
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
          />

          {/* Segment */}
          <select className="filter-select" value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)}>
            <option value="">Todos os Segmentos</option>
            {segments.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>

          {/* Website presence */}
          <select className="filter-select" value={filterWebsite} onChange={(e) => setFilterWebsite(e.target.value)}>
            <option value="">Presença de Site</option>
            <option value="0">Sem site próprio</option>
            <option value="1">Possui site</option>
          </select>

          {/* WhatsApp presence */}
          <select className="filter-select" value={filterWhatsapp} onChange={(e) => setFilterWhatsapp(e.target.value)}>
            <option value="">WhatsApp</option>
            <option value="1">Com WhatsApp</option>
            <option value="0">Sem WhatsApp</option>
          </select>

          {/* Phone presence */}
          <select className="filter-select" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)}>
            <option value="">Telefone Comercial</option>
            <option value="1">Com Telefone</option>
            <option value="0">Sem Telefone</option>
          </select>

          {/* Instagram presence */}
          <select className="filter-select" value={filterInstagram} onChange={(e) => setFilterInstagram(e.target.value)}>
            <option value="">Instagram</option>
            <option value="1">Com Instagram</option>
            <option value="0">Sem Instagram</option>
          </select>

          {/* Facebook presence */}
          <select className="filter-select" value={filterFacebook} onChange={(e) => setFilterFacebook(e.target.value)}>
            <option value="">Facebook</option>
            <option value="1">Com Facebook</option>
            <option value="0">Sem Facebook</option>
          </select>

          {/* Score/Prioridade */}
          <select className="filter-select" value={filterScore} onChange={(e) => setFilterScore(e.target.value)}>
            <option value="">Prioridade de Venda</option>
            <option value="80">Oportunidade Alta (&ge;80)</option>
            <option value="50">Oportunidade Média (&ge;50)</option>
          </select>

          {/* Rating */}
          <select className="filter-select" value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
            <option value="">Nota no Maps</option>
            <option value="4.5">Excelente (&ge; 4.5★)</option>
            <option value="4.0">Boa (&ge; 4.0★)</option>
            <option value="3.0">Regular (&ge; 3.0★)</option>
          </select>

          {/* Reviews count */}
          <select className="filter-select" value={filterReviews} onChange={(e) => setFilterReviews(e.target.value)}>
            <option value="">Contagem de Avaliações</option>
            <option value="100">Mais de 100 opiniões</option>
            <option value="50">Mais de 50 opiniões</option>
            <option value="10">Mais de 10 opiniões</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            type="button"
            className="filter-select" 
            style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            onClick={handleClearFilters}
          >
            <RefreshCw size={14} /> Limpar Todos os Filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div className="loader-spinner"></div>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' ? (
            /* Kanban Board */
            <div className="crm-board animate-fade-in">
              {COLUMNS.map(col => {
                const colLeads = leadsByStatus[col.id] || [];
                return (
                  <div 
                    className="crm-column" 
                    key={col.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className="crm-column-header">
                      <span className="crm-column-title" style={{ color: col.color }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color, marginRight: '4.5px' }}></span>
                        {col.title}
                      </span>
                      <span className="crm-column-badge">{colLeads.length}</span>
                    </div>

                    <div className="crm-cards-container">
                      {colLeads.map(lead => {
                        let scoreClass = 'low';
                        if (lead.opportunity_score >= 80) scoreClass = 'high';
                        else if (lead.opportunity_score >= 50) scoreClass = 'medium';

                        return (
                          <div 
                            className="crm-card" 
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onClick={() => onSelectLead(lead.id)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span 
                                className="crm-card-tag"
                                style={{ 
                                  backgroundColor: lead.opportunity_score >= 80 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(139, 92, 246, 0.08)',
                                  color: lead.opportunity_score >= 80 ? 'var(--color-danger)' : 'var(--accent-secondary)'
                                }}
                              >
                                {lead.segment}
                              </span>
                              
                              <button type="button" className="btn-close-drawer" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={(e) => handleDeleteLead(e, lead.id)}>
                                <Trash size={12} />
                              </button>
                            </div>

                            <h4 className="crm-card-title">{lead.name}</h4>
                            <p className="crm-card-desc">{lead.description}</p>
                            
                            {lead.owner && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                👤 {lead.owner}
                              </div>
                            )}
                            
                            {lead.value_negotiated > 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 'bold', marginTop: '4px', marginLeft: '6px', display: 'inline-block' }}>
                                R$ {lead.value_negotiated.toLocaleString('pt-BR')}
                              </div>
                            )}

                            <div className="crm-card-footer">
                              <span className={`crm-card-score ${scoreClass}`}>
                                {lead.opportunity_score}/100
                              </span>

                              <div style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)' }}>
                                {lead.has_website === 1 ? (
                                  <Globe size={12} title="Possui Site" />
                                ) : (
                                  <ShieldAlert size={12} title="Sem Site" style={{ color: 'var(--color-danger)' }} />
                                )}
                                {lead.rating > 0 && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Star size={10} fill="var(--color-warning)" stroke="none" />
                                    {lead.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {colLeads.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                          Arrastar cartões aqui
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List Table View */
            <div className="glass-card crm-list-table-wrapper animate-fade-in" style={{ overflowX: 'auto', padding: '0', borderRadius: '12px' }}>
              <table className="crm-list-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px' }}>Empresa</th>
                    <th style={{ padding: '16px' }}>Segmento / Categoria</th>
                    <th style={{ padding: '16px' }}>Localidade</th>
                    <th style={{ padding: '16px' }}>Avaliação Maps</th>
                    <th style={{ padding: '16px' }}>Prioridade</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Responsável</th>
                    <th style={{ padding: '16px' }}>Valor Negociado</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => {
                    const statusColor = COLUMNS.find(c => c.id === lead.status)?.color || 'var(--text-muted)';
                    return (
                      <tr 
                        key={lead.id} 
                        className="crm-list-row"
                        onClick={() => onSelectLead(lead.id)}
                        style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <td style={{ padding: '16px', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{lead.name}</td>
                        <td style={{ padding: '16px' }}>
                          <span className="crm-card-tag" style={{ margin: 0, backgroundColor: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent-secondary)' }}>
                            {lead.segment}
                          </span>
                          {lead.category && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{lead.category}</span>}
                        </td>
                        <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lead.city}/{lead.state}</td>
                        <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                          {lead.rating ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontWeight: '600' }}>
                              <Star size={12} fill="var(--color-warning)" stroke="none" />
                              {lead.rating} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.75rem' }}>({lead.reviews_count})</span>
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>Sem avaliações</span>}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            fontWeight: '800', 
                            fontSize: '0.9rem',
                            color: lead.opportunity_score >= 80 ? 'var(--color-danger)' : (lead.opportunity_score >= 50 ? 'var(--color-warning)' : 'var(--color-success)') 
                          }}>
                            {lead.opportunity_score}/100
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '3px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            fontWeight: '700',
                            backgroundColor: statusColor + '15',
                            color: statusColor
                          }}>
                            {lead.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lead.owner || '-'}</td>
                        <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                          {lead.value_negotiated > 0 ? `R$ ${lead.value_negotiated.toLocaleString('pt-BR')}` : '-'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <button 
                            type="button"
                            className="btn-close-drawer" 
                            style={{ padding: '6px', color: 'var(--text-muted)' }} 
                            onClick={(e) => handleDeleteLead(e, lead.id)}
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum lead encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
