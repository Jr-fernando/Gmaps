import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Building2, CheckCircle2, MessageSquare, Search, Target, TrendingUp } from 'lucide-react';
import { dashboardService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState({ totalLeads: 0, newLeads: 0, messagesSent: 0, replies: 0, responseRate: 0, closed: 0, conversionRate: 0, valueSold: 0, segmentsRank: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => { dashboardService.getStats().then(setStats).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;

  return <div className="overview-page animate-fade-in">
    <section className="overview-welcome">
      <div><span className="eyebrow"><TrendingUp size={14} /> Visão comercial</span><h1>Transforme negócios locais em novos clientes.</h1><p>Da descoberta no Google Maps ao fechamento, tudo em um único fluxo de prospecção.</p></div>
      <button className="launch-search" onClick={() => onNavigate('search')}><Search size={17} /> Nova busca</button>
    </section>
    <div className="metric-grid">
      <article><span><Building2 size={17} /> Base qualificada</span><strong>{stats.totalLeads}</strong><small>+{stats.newLeads} adicionados hoje</small></article>
      <article><span><MessageSquare size={17} /> Abordados</span><strong>{stats.messagesSent}</strong><small>{stats.responseRate}% de resposta</small></article>
      <article><span><CheckCircle2 size={17} /> Clientes</span><strong>{stats.closed}</strong><small>{stats.conversionRate}% de conversão</small></article>
      <article className="accent"><span><BarChart3 size={17} /> Receita no funil</span><strong>{formatCurrency(stats.valueSold)}</strong><small>Valor dos negócios fechados</small></article>
    </div>
    <div className="overview-grid">
      <section className="panel-card"><div className="panel-title"><div><span>Seu funil</span><h2>Da captura ao fechamento</h2></div><button onClick={() => onNavigate('crm')}>Abrir pipeline <ArrowRight size={15} /></button></div>
        <div className="funnel-modern">
          {[['Descobertos', stats.totalLeads, 100], ['Abordados', stats.messagesSent, stats.totalLeads ? stats.messagesSent / stats.totalLeads * 100 : 0], ['Responderam', stats.replies, stats.totalLeads ? stats.replies / stats.totalLeads * 100 : 0], ['Clientes', stats.closed, stats.totalLeads ? stats.closed / stats.totalLeads * 100 : 0]].map(([label, value, width], i) => <div key={label}><span>{i + 1}</span><label>{label}<b>{value}</b></label><i><em style={{ width: `${Math.max(width, value ? 8 : 0)}%` }} /></i></div>)}
        </div>
      </section>
      <section className="panel-card"><div className="panel-title"><div><span>Mercado</span><h2>Nichos mais prospectados</h2></div><Target size={20} /></div>
        <div className="segment-modern">{stats.segmentsRank.length ? stats.segmentsRank.map((item, index) => <div key={item.segment}><span>{index + 1}</span><strong>{item.segment || 'Geral'}</strong><em>{item.count} leads</em></div>) : <p>Faça sua primeira busca para descobrir os nichos mais promissores.</p>}</div>
      </section>
    </div>
  </div>;
}
