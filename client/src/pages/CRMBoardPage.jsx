import React, { useState } from 'react';
import { Filter, LayoutGrid, List, Trash, Star } from 'lucide-react';
import useLeads from '../hooks/useLeads';
import KanbanColumn from '../components/crm/KanbanColumn';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { formatCurrency } from '../utils/formatters';

const COLUMNS = [
  { id: 'Novo Lead', title: 'Novo Lead', color: 'var(--accent-primary)', icon: '🎯' },
  { id: 'Entrar em contato', title: 'Entrar em Contato', color: 'var(--color-info)', icon: '📞' },
  { id: 'Mensagem enviada', title: 'Mensagem Enviada', color: 'var(--accent-secondary)', icon: '✉️' },
  { id: 'Respondeu', title: 'Respondeu', color: 'var(--color-warning)', icon: '💬' },
  { id: 'Negociação', title: 'Negociação', color: '#ff7a00', icon: '🤝' },
  { id: 'Proposta enviada', title: 'Proposta Enviada', color: '#ec4899', icon: '📄' },
  { id: 'Cliente', title: 'Cliente Fechado', color: 'var(--color-success)', icon: '🎉' },
  { id: 'Perdido', title: 'Perdido', color: 'var(--text-muted)', icon: '❌' }
];

export default function CRMBoardPage({ onSelectLead, refreshTrigger }) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Filters State
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

  const activeFilters = {
    query: searchQuery,
    city: filterCity,
    state: filterState,
    segment: filterSegment,
    has_website: filterWebsite,
    min_score: filterScore,
    instagram: filterInstagram,
    facebook: filterFacebook,
    whatsapp: filterWhatsapp,
    phone: filterPhone,
    min_rating: filterRating,
    min_reviews: filterReviews
  };

  const {
    leads,
    loading,
    cities,
    segments,
    updateLeadStatus,
    deleteLead
  } = useLeads(activeFilters, refreshTrigger);

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
    try {
      await updateLeadStatus(leadId, targetStatus);
    } catch {
      // Error handles in hook and reloads
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Advanced Filters Panel */}
      <Card className="animate-fade-in" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Filter size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Painel de Filtros Avançados de Prospecção</span>
          </div>
          
          {/* Switcher Toggle */}
          <div className="view-mode-toggle">
            <button 
              type="button"
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none', 
                background: viewMode === 'kanban' ? 'var(--text-primary)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--bg-deep)' : '#fff',
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
                background: viewMode === 'list' ? 'var(--text-primary)' : 'transparent',
                color: viewMode === 'list' ? 'var(--bg-deep)' : '#fff',
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

          {/* City Filter */}
          <select 
            className="filter-select" 
            value={filterCity} 
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">Todas as cidades</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* State Filter */}
          <select 
            className="filter-select" 
            value={filterState} 
            onChange={(e) => setFilterState(e.target.value)}
          >
            <option value="">Todos os estados</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="RJ">Rio de Janeiro (RJ)</option>
            <option value="MG">Minas Gerais (MG)</option>
            <option value="RS">Rio Grande do Sul (RS)</option>
            <option value="PR">Paraná (PR)</option>
            <option value="BA">Bahia (BA)</option>
          </select>

          {/* Segment Filter */}
          <select 
            className="filter-select" 
            value={filterSegment} 
            onChange={(e) => setFilterSegment(e.target.value)}
          >
            <option value="">Todos os segmentos</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Website Filter */}
          <select 
            className="filter-select" 
            value={filterWebsite} 
            onChange={(e) => setFilterWebsite(e.target.value)}
          >
            <option value="">Filtro de Site</option>
            <option value="1">Possui Website</option>
            <option value="0">Não possui Website</option>
          </select>

          {/* Priority Score Filter */}
          <select 
            className="filter-select" 
            value={filterScore} 
            onChange={(e) => setFilterScore(e.target.value)}
          >
            <option value="">Filtro de Score</option>
            <option value="80">Altíssima Oportunidade (&gt;= 80)</option>
            <option value="60">Alta Oportunidade (&gt;= 60)</option>
            <option value="40">Média Oportunidade (&gt;= 40)</option>
          </select>

          {/* Rating Filter */}
          <select 
            className="filter-select" 
            value={filterRating} 
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">Filtro de Nota Maps</option>
            <option value="4.5">Excelente (&gt;= 4.5 ★)</option>
            <option value="4.0">Boa (&gt;= 4.0 ★)</option>
            <option value="3.0">Regular (&lt; 4.0 ★)</option>
          </select>

          {/* Reviews Filter */}
          <select 
            className="filter-select" 
            value={filterReviews} 
            onChange={(e) => setFilterReviews(e.target.value)}
          >
            <option value="">Filtro de Avaliações</option>
            <option value="100">Muitas (&gt;= 100)</option>
            <option value="50">Médio (&gt;= 50)</option>
            <option value="10">Poucas (&lt; 10)</option>
          </select>

          {/* Instagram Filter */}
          <select 
            className="filter-select" 
            value={filterInstagram} 
            onChange={(e) => setFilterInstagram(e.target.value)}
          >
            <option value="">Filtro de Instagram</option>
            <option value="1">Possui Instagram</option>
            <option value="0">Não possui Instagram</option>
          </select>

          {/* Facebook Filter */}
          <select 
            className="filter-select" 
            value={filterFacebook} 
            onChange={(e) => setFilterFacebook(e.target.value)}
          >
            <option value="">Filtro de Facebook</option>
            <option value="1">Possui Facebook</option>
            <option value="0">Não possui Facebook</option>
          </select>

          {/* WhatsApp Filter */}
          <select 
            className="filter-select" 
            value={filterWhatsapp} 
            onChange={(e) => setFilterWhatsapp(e.target.value)}
          >
            <option value="">Filtro de WhatsApp</option>
            <option value="1">Possui WhatsApp</option>
            <option value="0">Não possui WhatsApp</option>
          </select>

          {/* Phone Filter */}
          <select 
            className="filter-select" 
            value={filterPhone} 
            onChange={(e) => setFilterPhone(e.target.value)}
          >
            <option value="">Filtro de Telefone</option>
            <option value="1">Possui Telefone Fixo</option>
            <option value="0">Não possui Telefone</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <Button variant="secondary" onClick={handleClearFilters} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            Limpar Todos os Filtros
          </Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, height: '200px' }}>
          <div className="loader-spinner"></div>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' ? (
            /* Kanban Board */
            <div className="crm-board animate-fade-in">
              {COLUMNS.map(col => (
                <KanbanColumn 
                  key={col.id}
                  status={col.id}
                  title={col.title}
                  icon={col.icon}
                  leads={leads}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onSelectLead={onSelectLead}
                  onDeleteLead={deleteLead}
                />
              ))}
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
                          {lead.value_negotiated > 0 ? formatCurrency(lead.value_negotiated) : '-'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <button 
                            type="button"
                            className="btn-close-drawer" 
                            style={{ padding: '6px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }} 
                          onClick={() => deleteLead(lead.id)}
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
