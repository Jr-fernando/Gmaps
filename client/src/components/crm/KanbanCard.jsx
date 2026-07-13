import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function KanbanCard({ lead, onDragStart, onSelect, onDelete }) {
  const getScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <div 
      className="crm-card" 
      draggable 
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onSelect(lead.id)}
    >
      <span className={`crm-card-tag ${getScoreClass(lead.opportunity_score)}`}>
        Score: {lead.opportunity_score}
      </span>
      <h4 className="crm-card-title">{lead.name}</h4>
      <p className="crm-card-desc">{lead.segment} - {lead.city}</p>
      
      {lead.value_negotiated > 0 && (
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {formatCurrency(lead.value_negotiated)}
        </p>
      )}

      <div className="crm-card-footer">
        <span className="crm-card-score">{lead.rating} ★ ({lead.reviews_count})</span>
        <button 
          className="btn-copy-mini"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(lead.id);
          }}
          title="Deletar Lead"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
