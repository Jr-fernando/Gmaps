import React from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { formatDate } from '../../utils/formatters';

export default function Timeline({
  crmHistory,
  followUps,
  newHistoryText,
  setNewHistoryText,
  handleAddHistoryLog
}) {
  const getTimelineEvents = () => {
    const events = [];
    const safeHistory = Array.isArray(crmHistory) ? crmHistory : [];
    const safeFollowUps = Array.isArray(followUps) ? followUps : [];
    
    // Process manual history logs
    safeHistory.filter(Boolean).forEach(h => {
      events.push({
        date: h.date,
        type: h.type || 'manual_note',
        description: h.description,
        isCompleted: true
      });
    });

    // Process follow-ups from sequence
    safeFollowUps.filter(Boolean).forEach(f => {
      const body = typeof f?.message_body === 'string' ? f.message_body : 'Mensagem de acompanhamento';
      events.push({
        date: f.scheduled_for,
        type: 'followup',
        description: `Follow-up Dia ${f.sequence_day || '—'}: ${body.slice(0, 60)}${body.length > 60 ? '...' : ''}`,
        isCompleted: f.status === 'Enviado',
        isPending: f.status === 'Agendado',
        sequenceDay: f.sequence_day,
        status: f.status
      });
    });

    // Sort events by date descending
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="timeline-tab">
      <form onSubmit={handleAddHistoryLog} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Input 
          mini
          type="text"
          value={newHistoryText}
          onChange={(e) => setNewHistoryText(e.target.value)}
          placeholder="Adicionar nota de contato ou anotação manual..."
          style={{ height: '36px' }}
        />
        <Button variant="primary" type="submit" style={{ height: '36px' }}>
          Salvar Nota
        </Button>
      </form>

      <h4 className="timeline-title">Histórico de Contatos e Automações</h4>

      {timelineEvents.length === 0 ? (
        <div className="empty-state-box">Nenhum evento registrado no histórico.</div>
      ) : (
        <div className="timeline-container">
          {timelineEvents.map((evt, idx) => (
            <div 
              key={idx} 
              className={`timeline-event ${evt.isCompleted ? 'completed' : evt.isPending ? 'pending' : ''}`}
            >
              <div className="timeline-node"></div>
              <div className="timeline-header">
                <span className="timeline-day">
                  {evt.type === 'followup' ? `Sequência (Dia ${evt.sequenceDay})` : 'Nota de Contato'}
                </span>
                <span className="timeline-status">
                  {evt.type === 'followup' ? `[Status: ${evt.status}] - ` : ''}
                  {formatDate(evt.date)}
                </span>
              </div>
              <p className="timeline-msg">{evt.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
