import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Database, Award, CheckCircle, Globe, Instagram, ShieldAlert } from 'lucide-react';

const MOCK_LOGS = [
  'Conectando aos motores de busca...',
  'Pesquisando estabelecimentos no Google Maps...',
  'Filtrando empresas na região selecionada...',
  'Coletando informações de contato (Telefone, Redes Sociais, Site)...',
  'Analisando sites e estruturação digital...',
  'Testando segurança HTTPS e responsividade mobile...',
  'Auditando perfil de Instagram (frequência de postagem, links de bio)...',
  'IA gerando relatório de oportunidade e prospecção personalizado...',
  'Formatando relatórios técnicos e agendando sequência de follow-ups...',
  'Armazenando leads estruturados no banco de dados SQLite...',
  'Processo concluído com sucesso!'
];

export default function SearchView({ onSearchComplete }) {
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
      setLogs(prev => [...prev, ...MOCK_LOGS.slice(logIndexRef.current), `Sucesso: ${data.leads?.length || 0} novos leads adicionados!`]);
      
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
    <div className="search-box-wrapper">
      <div className="search-title-desc">
        <h2>Busca Inteligente de Leads</h2>
        <p>Preencha os termos de busca para encontrar empresas locais, auditar sua presença digital e cadastrá-las no CRM com relatórios de IA.</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearch}>
          <div className="search-form-row">
            <div className="input-group">
              <label className="input-label">O que você está procurando? (Segmento)</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Ex: Padaria, Clinica Odontológica, Oficina"
                  className="input-field"
                  style={{ paddingLeft: '38px', width: '100%' }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Em qual cidade? (Localidade)</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Ex: São Paulo, Belo Horizonte"
                  className="input-field"
                  style={{ paddingLeft: '38px', width: '100%' }}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-search" disabled={loading || !query.trim() || !city.trim()}>
              <Database size={18} />
              {loading ? 'Pesquisando...' : 'Pesquisar Empresas'}
            </button>
          </div>

          <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Fontes de Prospecção</label>
          <div className="sources-grid">
            <div className={`source-checkbox-label ${sources.gmaps ? 'checked' : ''}`} onClick={() => !loading && toggleSource('gmaps')}>
              <input type="checkbox" checked={sources.gmaps} onChange={() => {}} style={{ display: 'none' }} />
              Google Maps
            </div>
            <div className={`source-checkbox-label ${sources.instagram ? 'checked' : ''}`} onClick={() => !loading && toggleSource('instagram')}>
              <input type="checkbox" checked={sources.instagram} onChange={() => {}} style={{ display: 'none' }} />
              Instagram
            </div>
            <div className={`source-checkbox-label ${sources.gmybusiness ? 'checked' : ''}`} onClick={() => !loading && toggleSource('gmybusiness')}>
              <input type="checkbox" checked={sources.gmybusiness} onChange={() => {}} style={{ display: 'none' }} />
              Google Meu Negócio
            </div>
            <div className={`source-checkbox-label ${sources.facebook ? 'checked' : ''}`} onClick={() => !loading && toggleSource('facebook')}>
              <input type="checkbox" checked={sources.facebook} onChange={() => {}} style={{ display: 'none' }} />
              Facebook
            </div>
            <div className={`source-checkbox-label ${sources.linkedin ? 'checked' : ''}`} onClick={() => !loading && toggleSource('linkedin')}>
              <input type="checkbox" checked={sources.linkedin} onChange={() => {}} style={{ display: 'none' }} />
              LinkedIn
            </div>
          </div>
        </form>

        {/* Searching Status Area */}
        {loading && (
          <div className="search-status-box">
            <div className="loader-spinner"></div>
            <h4 style={{ fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '8px' }}>
              Buscando e Auditando Empresas...
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              A IA está rastreando sites e redes sociais para calcular o score de oportunidade.
            </p>
            <div className="search-logs">
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {`> ${log}`}
                </div>
              ))}
              <div ref={logsEndRef}></div>
            </div>
          </div>
        )}
      </div>

      {/* Search results after success */}
      {searchDone && !loading && (
        <div>
          <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
            Resultado da Pesquisa ({foundLeads.length} leads adicionados)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {foundLeads.length > 0 ? (
              foundLeads.map((lead, index) => (
                <div className="glass-card" key={index} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>{lead.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.segment} • {lead.city}/{lead.state}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {lead.has_website === 1 ? (
                        <span title="Possui Site" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}><Globe size={16} /></span>
                      ) : (
                        <span title="Sem Site (Oportunidade Alta!)" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '0.75rem', gap: '4px' }}>
                          <ShieldAlert size={16} /> Sem Site
                        </span>
                      )}
                      <span title="Instagram" style={{ color: lead.followers > 0 ? 'var(--accent-secondary)' : 'var(--text-muted)' }}><Instagram size={16} /></span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Oportunidade</span>
                      <span style={{ 
                        fontWeight: '800', 
                        color: lead.opportunity_score >= 80 ? 'var(--color-danger)' : (lead.opportunity_score >= 50 ? 'var(--color-warning)' : 'var(--color-success)'),
                        fontSize: '1.1rem'
                      }}>
                        {lead.opportunity_score}/100
                      </span>
                    </div>
                  </div>
                </div>
              ))
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
