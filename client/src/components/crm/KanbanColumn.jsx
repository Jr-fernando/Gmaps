import React from 'react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ 
  status, 
  title, 
  icon, 
  leads, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onSelectLead, 
  onDeleteLead 
}) {
  const filteredLeads = leads.filter(l => l.status === status);

  return (
    <div 
      className="crm-column"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="crm-column-header">
        <h3 className="crm-column-title">
          <span>{icon}</span> {title}
        </h3>
        <span className="crm-column-badge">{filteredLeads.length}</span>
      </div>
      <div className="crm-cards-container">
        {filteredLeads.length === 0 ? (
          <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            Sem leads nesta etapa
          </div>
        ) : (
          filteredLeads.map(lead => (
            <KanbanCard 
              key={lead.id}
              lead={lead}
              onDragStart={onDragStart}
              onSelect={onSelectLead}
              onDelete={onDeleteLead}
            />
          ))
        )}
      </div>
    </div>
  );
}
