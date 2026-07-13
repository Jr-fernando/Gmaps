import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Database, CheckCircle, Globe, Instagram, Mail, Phone, 
  ShieldAlert, Star, Clock, Copy, Check, Eye, ChevronRight, AlertCircle, HelpCircle
} from 'lucide-react';
import { leadService, settingsService } from '../services/api';

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
  
  // Advanced filters state
  const [filterRadius, setFilterRadius] = useState('');
  const [filterMinReviews, setFilterMinReviews] = useState('');
  const [filterRatingRange, setFilterRatingRange] = useState('');
  const [filterOpportunity, setFilterOpportunity] = useState('');
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [filterNoInstagram, setFilterNoInstagram] = useState(false);
  const [filterNoFacebook, setFilterNoFacebook] = useState(false);

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [foundLeads, setFoundLeads] = useState([]);
  const [searchDone, setSearchDone] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  
  // Google Places Key Configuration State
  const [isPlacesKeyConfigured, setIsPlacesKeyConfigured] = useState(true);
  const [showKeyHelp, setShowKeyHelp] = useState(false);

  const logsEndRef = useRef(null);
  const logIndexRef = useRef(0);
  const logIntervalRef = useRef(null);

  // Fetch settings to check if Places API is configured
  useEffect(() => {
    settingsService.getSettings()
      .then(data => {
        if (!data.google_places_api_key_configured) {
          setIsPlacesKeyConfigured(false);
        } else {
          setIsPlacesKeyConfigured(true);
        }
      })
      .catch(() => setIsPlacesKeyConfigured(false));
  }, []);

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
    }, 1000);

    try {
      const data = await leadService.searchLeads(query, city);
      
      // Stop logger and flush rest of the logs
      clearInterval(logIntervalRef.current);
      setLogs(prev => [
        ...prev, 
        ...MOCK_LOGS.slice(logIndexRef.current), 
        `Sucesso: ${data.leads?.length || 0} novos leads adicionados com análise inteligente!`
      ]);
      
      // Apply advanced local filters on scraped results
      let filtered = data.leads || [];
      
      if (filterMinReviews) {
        filtered = filtered.filter(l => l.reviews_count >= parseInt(filterMinReviews));
      }
      if (filterRatingRange) {
        if (filterRatingRange === 'low') filtered = filtered.filter(l => l.rating < 4.0);
        if (filterRatingRange === 'high') filtered = filtered.filter(l => l.rating >= 4.5);
      }
      if (filterOpportunity) {
        filtered = filtered.filter(l => l.opportunity_score >= parseInt(filterOpportunity));
      }
      if (filterNoWebsite) {
        filtered = filtered.filter(l => l.has_website === 0 || !l.website);
      }
      if (filterNoInstagram) {
        filtered = filtered.filter(l => !l.instagram);
      }
      if (filterNoFacebook) {
        filtered = filtered.filter(l => !l.facebook);
      }

      setFoundLeads(filtered);
      setSearchDone(true);
      if (onSearchComplete) onSearchComplete();
    } catch (err) {
      clearInterval(logIntervalRef.current);
      setLogs(prev => [...prev, `Erro durante a pesquisa: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, key, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(`${key}_${index}`);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      setLogs(prev => [...prev, 'Não foi possível copiar para a área de transferência.']);
    }
  };

  useEffect(() => {
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

      {/* Google Places Key Callout Alert */}
      {!isPlacesKeyConfigured && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-warning)', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <AlertCircle size={18} />
            <span>Modo de Simulação Ativo (Places API Key Ausente)</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem' }}>
            A Google Places API Key não está cadastrada em Configurações. O robô irá gerar simulações completas e detalhadas baseadas em bairros e cidades reais de empresas locais para demonstração de prospecção.
          </p>
          <button 
            type="button" 
            onClick={() => setShowKeyHelp(!showKeyHelp)}
            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--accent-primary)', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <HelpCircle size={12} /> {showKeyHelp ? 'Esconder ajuda' : 'Como configurar a chave real?'}
          </button>

          {showKeyHelp && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: '1.5' }}>
              <strong>Passo a passo para chave oficial:</strong>
              <ol style={{ paddingLeft: '20px', margin: '4px 0 0 0' }}>
                <li>Acesse o console de desenvolvedores do Google Cloud.</li>
                <li>Habilite as bibliotecas <strong>Places API</strong> e <strong>Maps JavaScript API</strong>.</li>
                <li>Crie uma credencial de chave de API.</li>
                <li>Insira a chave na aba de <strong>Configurações</strong> deste painel para iniciar a captura de dados de empresas reais do Google Maps.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Main Search Panel */}
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

          {/* Advanced Prospecting Filters Accordion */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
              Filtros Avançados de Qualificação
            </span>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {/* Raio em KM */}
              <div className="input-group">
                <label className="input-label-mini" style={{ color: 'var(--text-muted)' }}>Raio de Prospecção (KM)</label>
                <select className="filter-select" style={{ width: '100%', height: '36px' }} value={filterRadius} onChange={(e) => setFilterRadius(e.target.value)}>
                  <option value="">Todo o município</option>
                  <option value="5">Até 5 KM do centro</option>
                  <option value="15">Até 15 KM do centro</option>
                  <option value="30">Até 30 KM do centro</option>
                </select>
              </div>

              {/* Avaliações Mínimas */}
              <div className="input-group">
                <label className="input-label-mini" style={{ color: 'var(--text-muted)' }}>Volume Mínimo de Opiniões</label>
                <select className="filter-select" style={{ width: '100%', height: '36px' }} value={filterMinReviews} onChange={(e) => setFilterMinReviews(e.target.value)}>
                  <option value="">Qualquer volume</option>
                  <option value="50">Mais de 50 opiniões</option>
                  <option value="15">Mais de 15 opiniões</option>
                  <option value="5">Mais de 5 opiniões</option>
                </select>
              </div>

              {/* Faixa de Avaliação */}
              <div className="input-group">
                <label className="input-label-mini" style={{ color: 'var(--text-muted)' }}>Faixa de Estrelas (Maps)</label>
                <select className="filter-select" style={{ width: '100%', height: '36px' }} value={filterRatingRange} onChange={(e) => setFilterRatingRange(e.target.value)}>
                  <option value="">Todas as notas</option>
                  <option value="low">Mal avaliadas (&lt; 4.0★)</option>
                  <option value="high">Altamente avaliadas (&ge; 4.5★)</option>
                </select>
              </div>

              {/* Oportunidade */}
              <div className="input-group">
                <label className="input-label-mini" style={{ color: 'var(--text-muted)' }}>Prioridade Comercial IA</label>
                <select className="filter-select" style={{ width: '100%', height: '36px' }} value={filterOpportunity} onChange={(e) => setFilterOpportunity(e.target.value)}>
                  <option value="">Todos os scores</option>
                  <option value="80">Alta Oportunidade (&ge;80)</option>
                  <option value="50">Média Oportunidade (&ge;50)</option>
                </select>
              </div>
            </div>

            {/* Checkboxes presence */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={filterNoWebsite} onChange={(e) => setFilterNoWebsite(e.target.checked)} />
                Filtrar empresas sem website
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={filterNoInstagram} onChange={(e) => setFilterNoInstagram(e.target.checked)} />
                Filtrar sem perfil de Instagram
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={filterNoFacebook} onChange={(e) => setFilterNoFacebook(e.target.checked)} />
                Filtrar sem página de Facebook
              </label>
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
            Resultado da Captura ({foundLeads.length} leads qualificados adicionados ao CRM)
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
