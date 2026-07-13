import React, { useEffect, useState } from 'react';
import { Users, Send, MessageSquare, DollarSign } from 'lucide-react';
import { dashboardService } from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import { formatCurrency } from '../utils/formatters';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    messagesSent: 0,
    replies: 0,
    responseRate: 0,
    closed: 0,
    conversionRate: 0,
    valueSold: 0,
    segmentsRank: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar estatísticas do painel:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  const maxSegmentCount = stats.segmentsRank.length > 0 
    ? Math.max(...stats.segmentsRank.map(s => s.count)) 
    : 1;

  return (
    <div className="animate-fade-in">
      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <StatCard 
          label="Total de Leads"
          value={stats.totalLeads}
          icon={<Users size={18} />}
          meta={
            <>
              <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>+{stats.newLeads}</span> novos leads hoje
            </>
          }
        />

        <StatCard 
          label="Abordados"
          value={stats.messagesSent}
          icon={<Send size={18} />}
          className="info"
          meta="Sequências ativas"
        />

        <StatCard 
          label="Taxa de Resposta"
          value={`${stats.responseRate}%`}
          icon={<MessageSquare size={18} />}
          className="warning"
          meta={`${stats.replies} contatos responderam`}
        />

        <StatCard 
          label="Faturamento Estimado"
          value={formatCurrency(stats.valueSold)}
          icon={<DollarSign size={18} />}
          className="success"
          meta={
            <>
              <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{stats.conversionRate}%</span> de conversão ({stats.closed} fechados)
            </>
          }
        />
      </div>

      {/* Main Graphs Panel */}
      <div className="dashboard-grid">
        <div className="glass-card">
          <h3 className="section-header">Funil de Prospecção</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                1. Capturados
              </div>
              <div style={{ flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', height: '36px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', opacity: 0.85, display: 'flex', alignItems: 'center', paddingLeft: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{stats.totalLeads} Leads</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                2. Abordados
              </div>
              <div style={{ flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', height: '36px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  width: `${stats.totalLeads > 0 ? (stats.messagesSent / stats.totalLeads) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', 
                  opacity: 0.85, 
                  display: 'flex', 
                  alignItems: 'center', 
                  paddingLeft: '12px',
                  minWidth: stats.messagesSent > 0 ? '60px' : '0' 
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{stats.messagesSent} ({stats.totalLeads > 0 ? Math.round((stats.messagesSent / stats.totalLeads) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                3. Responderam
              </div>
              <div style={{ flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', height: '36px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  width: `${stats.messagesSent > 0 ? (stats.replies / stats.messagesSent) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', 
                  opacity: 0.85, 
                  display: 'flex', 
                  alignItems: 'center', 
                  paddingLeft: '12px',
                  minWidth: stats.replies > 0 ? '60px' : '0'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{stats.replies} ({stats.responseRate}%)</span>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                4. Fechados (Clientes)
              </div>
              <div style={{ flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', height: '36px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  width: `${stats.totalLeads > 0 ? (stats.closed / stats.totalLeads) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #10b981, #34d399)', 
                  opacity: 0.85, 
                  display: 'flex', 
                  alignItems: 'center', 
                  paddingLeft: '12px',
                  minWidth: stats.closed > 0 ? '60px' : '0'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{stats.closed} ({stats.conversionRate}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="section-header">Top Segmentos</h3>
          
          <div className="segment-rank-list">
            {stats.segmentsRank.length > 0 ? (
              stats.segmentsRank.map((seg, idx) => (
                <div className="segment-item" key={idx}>
                  <div className="segment-info">
                    <span className="segment-name">{seg.segment}</span>
                    <span className="segment-count">{seg.count} leads</span>
                  </div>
                  <div className="segment-bar-wrapper">
                    <div 
                      className="segment-bar" 
                      style={{ width: `${(seg.count / maxSegmentCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                Nenhum segmento registrado ainda. Inicie uma busca para coletar leads!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
