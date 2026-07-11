import React, { useEffect, useState } from 'react';
import { ShieldAlert, Globe, Star, ArrowRight, UserPlus, Filter, RefreshCw, Trash } from 'lucide-react';

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

export default function CRMBoardView({ onSelectLead, refreshTrigger }) {
  const [leads, setLeads] = useState([]);
  const [cities, setCities] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterCity, setFilterCity] = useState('');
  const [filterSegment, setFilterSegment] = useState('');
  const [filterWebsite, setFilterWebsite] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeads = () => {
    setLoading(true);
    let url = `/api/leads?`;
    if (filterCity) url += `city=${encodeURIComponent(filterCity)}&`;
    if (filterSegment) url += `segment=${encodeURIComponent(filterSegment)}&`;
    if (filterWebsite !== '') url += `has_website=${filterWebsite}&`;
    if (filterScore) url += `min_score=${filterScore}&`;
    if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;

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
  };

  useEffect(() => {
    fetchLeads();
  }, [filterCity, filterSegment, filterWebsite, filterScore, searchQuery, refreshTrigger]);

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

  // Group leads by status
  const leadsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(l => l.status === col.id);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filters Bar */}
      <div className="filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginRight: '12px' }}>
          <Filter size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Filtros:</span>
        </div>

        <input
          type="text"
          placeholder="Buscar por nome..."
          className="filter-select"
          style={{ width: '180px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select className="filter-select" value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
          <option value="">Todas as Cidades</option>
          {cities.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>

        <select className="filter-select" value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)}>
          <option value="">Todos os Segmentos</option>
          {segments.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>

        <select className="filter-select" value={filterWebsite} onChange={(e) => setFilterWebsite(e.target.value)}>
          <option value="">Presença Web</option>
          <option value="0">Sem site próprio</option>
          <option value="1">Com site próprio</option>
        </select>

        <select className="filter-select" value={filterScore} onChange={(e) => setFilterScore(e.target.value)}>
          <option value="">Qualquer Prioridade</option>
          <option value="80">Oportunidade Alta (&ge;80)</option>
          <option value="50">Oportunidade Média (&ge;50)</option>
        </select>

        <button 
          className="filter-select" 
          style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}
          onClick={() => {
            setFilterCity('');
            setFilterSegment('');
            setFilterWebsite('');
            setFilterScore('');
            setSearchQuery('');
          }}
        >
          <RefreshCw size={14} /> Limpar
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="crm-board">
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
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color, marginRight: '4px' }}></span>
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
                            backgroundColor: lead.opportunity_score >= 80 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: lead.opportunity_score >= 80 ? 'var(--color-danger)' : 'var(--accent-primary)'
                          }}
                        >
                          {lead.segment}
                        </span>
                        
                        <button className="btn-close-drawer" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={(e) => handleDeleteLead(e, lead.id)}>
                          <Trash size={12} />
                        </button>
                      </div>

                      <h4 className="crm-card-title">{lead.name}</h4>
                      <p className="crm-card-desc">{lead.description}</p>
                      
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
    </div>
  );
}
