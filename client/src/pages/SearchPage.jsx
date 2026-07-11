import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Database, CheckCircle, Globe, Instagram, Mail, Phone, 
  ShieldAlert, Star, Clock, Copy, Check, Eye, ChevronRight
} from 'lucide-react';

const MOCK_LOGS = [
  'Conectando aos motores de busca locais...',
  'Pesquisando estabelecimentos no Google Maps...',
  'Filtrando empresas na região selecionada...',
  'Coletando informações de contato (Telefone, Redes Sociais, Site)...',
  'Analisando sites e estruturação digital...',
  'Testando segurança HTTPS e responsividade mobile...',
  'Auditando perfil de Instagram (frequência de postagem, links de bio)...',
  'IA gerando relatório de oportunidade e prospecção personalizado...',
  'Formatando relatórios técnicos e agendando sequência de follow-ups...',
  'Armazenando leads estruturados no banco de dados SQLite/Supabase...',
  'Processo concluído com sucesso!'
];

export default function SearchPage({ onSearchComplete, onSelectLead }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [sources, setSources] = useState({
    gmaps: true,
    instagram: true,
    facebook: false,
    linkedin: false,
    gmybusiness: true
  });
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [foundLeads, setFoundLeads] = useState([]);
  const [searchDone, setSearchDone] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  
  const logsEndRef = useRef(null);
  const logIndexRef = useRef(0);
  const logIntervalRef = useRef(null);

  const toggleSource = (key) => {
    setSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || !city.trim()) return;

    setLoading(true);
    setSearchDone(false);
    setFoundLeads([]);
    setLogs(['Iniciando robô de busca de leads...']);
    logIndexRef.current = 0;

    // Start logging animation
    logIntervalRef.current = setInterval(() => {
      if (logIndexRef.current < MOCK_LOGS.length) {
        setLogs(prev => [...prev, MOCK_LOGS[logIndexRef.current]]);
        logIndexRef.current += 1;
      } else {
        clearInterval(logIntervalRef.current);
      }
    }, 1200);

    try {
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, city })
      });
      
      const data = await response.json();
      
      // Stop logger and flush rest of the logs
      clearInterval(logIntervalRef.current);
      setLogs(prev => [
        ...prev, 
        ...MOCK_LOGS.slice(logIndexRef.current), 
        `Sucesso: ${data.leads?.length || 0} novos leads adicionados com análise inteligente!`
      ]);
      
      setFoundLeads(data.leads || []);
      setSearchDone(true);
      if (onSearchComplete) onSearchComplete();
    } catch (err) {
      clearInterval(logIntervalRef.current);
      setLogs(prev => [...prev, `Erro durante a pesquisa: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key, index) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(`${key}_${index}`);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  useEffect(() => {
    // Auto-scroll logs to bottom
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    return () => clearInterval(logIntervalRef.current);
  }, []);

  return (
    <div className="search-box-wrapper animate-fade-in">
      <div className="search-title-desc" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
          Busca Inteligente de Leads (Scraper Local)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Rastreie empresas locais no Google Maps e redes sociais, auditando a presença web e gerando diagnósticos comerciais automáticos usando inteligência artificial.
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
        <form onSubmit={handleSearch}>
          <div className="search-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '20px' }}>
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                O que você está procurando? (Segmento/Nicho)
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Ex: Padaria, Clínica Odontológica, Oficina Mecânica"
                  className="input-field"
                  style={{ paddingLeft: '38px', width: '100%', borderRadius: '8px' }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Em qual cidade? (Localidade)
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Ex: São Paulo, Rio de Janeiro"
                  className="input-field"
                  style={{ paddingLeft: '38px', width: '100%', borderRadius: '8px' }}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-search" style={{ padding: '14px 24px', borderRadius: '8px', height: '46px' }} disabled={loading || !query.trim() || !city.trim()}>
              <Database size={16} />
              {loading ? 'Prospectando...' : 'Iniciar Prospecção'}
            </button>
          </div>

          <label className="input-label" style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
            Canais de Rastreamento de Contatos
          </label>
          <div className="sources-grid" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className={`source-checkbox-label ${sources.gmaps ? 'checked' : ''}`} onClick={() => !loading && toggleSource('gmaps')} style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Google Maps
            </div>
            <div className={`source-checkbox-label ${sources.gmybusiness ? 'checked' : ''}`} onClick={() => !loading && toggleSource('gmybusiness')} style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Google Meu Negócio
            </div>
            <div className={`source-checkbox-label ${sources.instagram ? 'checked' : ''}`} onClick={() => !loading && toggleSource('instagram')} style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Instagram Bio
            </div>
            <div className={`source-checkbox-label ${sources.facebook ? 'checked' : ''}`} onClick={() => !loading && toggleSource('facebook')} style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Facebook Page
            </div>
            <div className={`source-checkbox-label ${sources.linkedin ? 'checked' : ''}`} onClick={() => !loading && toggleSource('linkedin')} style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              LinkedIn Company
            </div>
          </div>
        </form>

        {/* Searching Status Log Window */}
        {loading && (
          <div className="search-status-box" style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="loader-spinner" style={{ width: '16px', height: '16px', borderThickness: '2px', margin: 0 }}></div>
              <h4 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Robô de Prospecção Ativo
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Aguarde enquanto a IA executa varreduras de SEO, responsividade de layouts e frequência de posts sociais.
            </p>
            <div className="search-logs" style={{ maxHeight: '150px', overflowY: 'auto', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-success)', lineHeight: '1.5' }}>
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>
                  {`> ${log}`}
                </div>
              ))}
              <div ref={logsEndRef}></div>
            </div>
          </div>
        )}
      </div>

      {/* Rich Search results list */}
      {searchDone && !loading && (
        <div className="animate-fade-in">
          <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>
            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
            Resultado da Captura ({foundLeads.length} leads adicionados ao CRM)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {foundLeads.length > 0 ? (
              foundLeads.map((lead, idx) => {
                const isCopiedPhone = copiedKey === `phone_${idx}`;
                const isCopiedWhatsapp = copiedKey === `whatsapp_${idx}`;

                return (
                  <div className="glass-card animate-fade-in" key={idx} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', borderRadius: '12px', transition: 'transform 0.2s, border-color 0.2s' }}>
                    
                    {/* Top row: Name, Category, Opportunity Score */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div>
                        <h4 style={{ fontWeight: '800', color: '#fff', fontSize: '1.1rem', margin: '0 0 4px 0' }}>{lead.name}</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="crm-card-tag" style={{ margin: 0, fontSize: '0.7rem', backgroundColor: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent-secondary)' }}>
                            {lead.segment}
                          </span>
                          {lead.category && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              • Categoria: {lead.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Prioridade</span>
                        <span style={{ 
                          fontWeight: '800', 
                          color: lead.opportunity_score >= 80 ? 'var(--color-danger)' : (lead.opportunity_score >= 50 ? 'var(--color-warning)' : 'var(--color-success)'),
                          fontSize: '1.2rem',
                          lineHeight: 1
                        }}>
                          {lead.opportunity_score}/100
                        </span>
                      </div>
                    </div>

                    {/* Middle details: Location, rating, schedule */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '12px 14px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '6px', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span>{lead.address || `${lead.city}/${lead.state}`}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Clock size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span>{lead.schedule || 'Horário de funcionamento não disponível'}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                        {lead.rating ? (
                          <>
                            <Star size={14} fill="var(--color-warning)" stroke="none" />
                            <strong>{lead.rating}</strong>
                            <span style={{ color: 'var(--text-muted)' }}>({lead.reviews_count} avaliações)</span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sem avaliações no Maps</span>
                        )}
                      </div>
                    </div>

                    {/* Contact Links & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Phone */}
                        {lead.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                            <Phone size={12} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ color: '#fff' }}>{lead.phone}</span>
                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              onClick={() => handleCopy(lead.phone, 'phone', idx)}
                            >
                              {isCopiedPhone ? <Check size={10} style={{ color: 'var(--color-success)' }} /> : <Copy size={10} />}
                            </button>
                          </div>
                        )}

                        {/* WhatsApp */}
                        {lead.whatsapp && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            <Phone size={12} style={{ color: 'var(--color-success)' }} />
                            <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>WhatsApp</span>
                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              onClick={() => handleCopy(`55${lead.whatsapp.replace(/[^0-9]/g, '')}`, 'whatsapp', idx)}
                            >
                              {isCopiedWhatsapp ? <Check size={10} style={{ color: 'var(--color-success)' }} /> : <Copy size={10} />}
                            </button>
                          </div>
                        )}

                        {/* Social Badges */}
                        {lead.instagram && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>
                            <Instagram size={12} /> {lead.instagram}
                          </span>
                        )}
                        {lead.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Mail size={12} /> {lead.email}
                          </span>
                        )}
                      </div>

                      {/* Site Presence Badge */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {lead.has_website === 1 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            <Globe size={12} /> Possui Website
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                            <ShieldAlert size={12} /> Oportunidade: Sem Site
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                      {lead.gmaps_link && (
                        <a 
                          href={lead.gmaps_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-channel border"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} /> Maps
                        </a>
                      )}
                      
                      {lead.website && (
                        <a 
                          href={lead.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-channel border"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Globe size={12} /> Visitar Site
                        </a>
                      )}

                      <button 
                        type="button" 
                        className="btn-trigger-cron"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => onSelectLead(lead.id)}
                      >
                        Ver Perfil Completo <ChevronRight size={12} />
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma empresa nova encontrada na região ou todas as empresas encontradas já estão cadastradas no CRM.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
