import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Building2, Check, ChevronDown, Clapperboard, Clock3, FolderPlus, Globe2, Instagram, LoaderCircle,
  MapPin, MessageCircle, Search, SlidersHorizontal, Sparkles, Star, Target, WandSparkles
} from 'lucide-react';
import { folderService, leadService, searchService, settingsService } from '../services/api';

const NEEDS = [
  { id: 'social_media', label: 'Social media', hint: 'Instagram ausente ou fraco', icon: Instagram },
  { id: 'content', label: 'Edição e conteúdo', hint: 'Prova social sem conteúdo estratégico', icon: Clapperboard },
  { id: 'website', label: 'Site ou landing page', hint: 'Sem site ou experiência ruim', icon: Globe2 },
  { id: 'whatsapp', label: 'WhatsApp e automação', hint: 'Atendimento sem conversão', icon: MessageCircle },
  { id: 'traffic', label: 'Tráfego pago', hint: 'Boa reputação, pouca aquisição', icon: Target },
];

const INITIAL = {
  query: '', city: 'São Paulo', region: '', radius: '15', needs: ['social_media'],
  minReviews: '10', maxRating: '', onlyNoWebsite: false, onlyNoInstagram: false,
  excludeSaved: true, limit: '20', sortMode: 'vulnerable'
};

const SEARCH_SESSION_KEY = 'leadmap.active-search.v1';
const readSearchSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SEARCH_SESSION_KEY) || '{}'); } catch { return {}; }
};

const SORT_OPTIONS = [
  { value: 'vulnerable', label: 'Mais vulneráveis primeiro' },
  { value: 'easiest', label: 'Mais fáceis de fechar' },
  { value: 'hardest', label: 'Mais difíceis primeiro' },
  { value: 'reputation', label: 'Melhor reputação local' },
];

const qualificationOf = (lead) => lead.website_analysis?.qualification || lead.social_analysis?.qualification || {};

export default function SearchPage({ onSearchComplete, onSelectLead }) {
  const [initialSession] = useState(readSearchSession);
  const [form, setForm] = useState(() => ({ ...INITIAL, ...(initialSession.form || {}) }));
  const [advanced, setAdvanced] = useState(Boolean(initialSession.advanced));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(initialSession.summary || null);
  const [error, setError] = useState('');
  const [savedSearches, setSavedSearches] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [activeSearchId, setActiveSearchId] = useState(initialSession.activeSearchId || '');
  const resultsRef = useRef(null);
  const restoreSearchId = initialSession.activeSearchId || '';

  const selectedNeeds = useMemo(() => NEEDS.filter((item) => form.needs.includes(item.id)), [form.needs]);
  const sortedResults = useMemo(() => {
    const score = (lead, key, fallback = 0) => Number(qualificationOf(lead)[key] ?? fallback);
    return [...results].sort((a, b) => {
      if (form.sortMode === 'easiest') return score(a, 'difficultyScore', 100) - score(b, 'difficultyScore', 100);
      if (form.sortMode === 'hardest') return score(b, 'difficultyScore') - score(a, 'difficultyScore');
      if (form.sortMode === 'reputation') return score(b, 'reputationScore') - score(a, 'reputationScore');
      return score(b, 'vulnerabilityScore') - score(a, 'vulnerabilityScore');
    });
  }, [results, form.sortMode]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleNeed = (id) => setForm((current) => {
    const selected = current.needs.includes(id);
    if (selected && current.needs.length === 1) return current;
    return { ...current, needs: selected ? current.needs.filter((need) => need !== id) : [...current.needs, id] };
  });

  useEffect(() => {
    const savedPromise = searchService.getSaved().then((data) => setSavedSearches(Array.isArray(data) ? data : [])).catch(() => setSavedSearches([]));
    const foldersPromise = folderService.getAll().then((data) => setFolders(Array.isArray(data) ? data : [])).catch(() => setFolders([]));
    const activePromise = restoreSearchId
      ? searchService.getById(restoreSearchId).then(({ leads }) => setResults(leads || [])).catch(() => setActiveSearchId(''))
      : Promise.resolve();
    Promise.all([savedPromise, foldersPromise, activePromise]).catch(() => {});
  }, [restoreSearchId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SEARCH_SESSION_KEY, JSON.stringify({ form, advanced, summary, activeSearchId }));
    } catch { /* The current search still works when browser storage is unavailable. */ }
  }, [form, advanced, summary, activeSearchId]);

  useEffect(() => {
    const available = new Set(results.map((lead) => String(lead.id)).filter(Boolean));
    setSelectedIds((current) => current.filter((id) => available.has(String(id))));
    setAiResult(null);
  }, [results]);

  const toggleSelected = (id) => setSelectedIds((current) => current.includes(String(id)) ? current.filter((item) => item !== String(id)) : [...current, String(id)]);
  const selectableIds = sortedResults.map((lead) => String(lead.id)).filter(Boolean);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : selectableIds);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setBulkBusy(true); setBulkMessage('');
    try {
      const folder = await folderService.create(newFolderName);
      const next = await folderService.getAll();
      setFolders(next); setFolderId(folder.id); setNewFolderName('');
      setBulkMessage(`Pasta “${folder.name}” criada.`);
    } catch (err) { setBulkMessage(err.message); }
    finally { setBulkBusy(false); }
  };

  const saveSelection = async () => {
    if (!selectedIds.length) return setBulkMessage('Selecione pelo menos uma empresa.');
    if (!folderId) return setBulkMessage('Escolha ou crie uma pasta para organizar a seleção.');
    setBulkBusy(true); setBulkMessage('');
    try {
      const updated = await folderService.addLeads(folderId, selectedIds);
      setFolders((current) => current.map((folder) => folder.id === updated.id ? updated : folder));
      setBulkMessage(`${selectedIds.length} empresa${selectedIds.length === 1 ? '' : 's'} adicionada${selectedIds.length === 1 ? '' : 's'} à pasta “${updated.name}”.`);
    } catch (err) { setBulkMessage(err.message); }
    finally { setBulkBusy(false); }
  };

  const prioritizeSelection = async () => {
    if (!selectedIds.length) return setBulkMessage('Selecione as empresas que a IA deve comparar.');
    setBulkBusy(true); setBulkMessage(''); setAiResult(null);
    try { setAiResult(await leadService.prioritize(selectedIds, selectedNeeds.map((item) => item.label).join(', '))); }
    catch (err) { setBulkMessage(err.message); }
    finally { setBulkBusy(false); }
  };

  const openSavedSearch = async (item) => {
    setError('');
    setLoading(true);
    try {
      const data = await searchService.getById(item.id);
      const restoredForm = {
        ...INITIAL,
        query: item.query || '',
        city: item.city || '',
        region: item.region || '',
        needs: Array.isArray(item.needs) && item.needs.length ? item.needs : INITIAL.needs,
        radius: String(item.radius || INITIAL.radius),
        minReviews: String(item.minReviews ?? INITIAL.minReviews),
        maxRating: item.maxRating === undefined || item.maxRating === null ? '' : String(item.maxRating),
        onlyNoWebsite: Boolean(item.onlyNoWebsite),
        onlyNoInstagram: Boolean(item.onlyNoInstagram),
        excludeSaved: item.excludeSaved !== false,
        limit: String(item.requested || INITIAL.limit),
        sortMode: item.sortMode || INITIAL.sortMode,
      };
      setForm(restoredForm);
      setResults(data.leads || []);
      setActiveSearchId(item.id);
      setSummary({
        count: data.leads?.length || 0,
        realData: true,
        needs: restoredForm.needs.map((need) => NEEDS.find((entry) => entry.id === need)?.label || need),
        requested: item.requested || data.leads?.length || 0,
        shortfall: Math.max((item.requested || 0) - (data.leads?.length || 0), 0),
        restored: true,
      });
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    } catch (err) {
      setError(err.message || 'Não foi possível reabrir essa busca.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const settings = await settingsService.getSettings().catch(() => ({}));
      const data = await leadService.searchLeads({
        query: form.query,
        city: form.city,
        region: form.region,
        radius: Number(form.radius),
        needs: form.needs,
        minReviews: Number(form.minReviews || 0),
        maxRating: form.maxRating ? Number(form.maxRating) : undefined,
        onlyNoWebsite: form.onlyNoWebsite,
        onlyNoInstagram: form.onlyNoInstagram,
        excludeSaved: form.excludeSaved,
        limit: Number(form.limit),
        sortMode: form.sortMode,
      });
      setResults(data.leads || []);
      setActiveSearchId(data.searchId || '');
      setSummary({
        count: data.leads?.length || 0,
        realData: Boolean(settings.google_places_api_key_configured),
        needs: selectedNeeds.map((item) => item.label),
        requested: data.requested || Number(form.limit),
        shortfall: data.shortfall || 0,
      });
      const saved = await searchService.getSaved().catch(() => []);
      setSavedSearches(Array.isArray(saved) ? saved : []);
      onSearchComplete?.();
    } catch (err) {
      setError(err.message || 'Não foi possível concluir a busca.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prospecting-page animate-fade-in">
      <section className="prospecting-hero">
        <div className="eyebrow"><Sparkles size={14} /> Prospecção orientada por oportunidade</div>
        <h1>Encontre empresas que já precisam do que você vende.</h1>
        <p>Escolha um nicho, uma região e a dor digital. O GMaps encontra, qualifica e organiza os melhores contatos para sua abordagem.</p>
      </section>

      <form className="prospecting-builder" onSubmit={submit}>
        <div className="builder-section">
          <div className="builder-step"><span>1</span><div><strong>Quem você quer encontrar?</strong><small>Defina o nicho e a localização</small></div></div>
          <div className="builder-grid primary-fields">
            <label className="field-shell">
              <span>Nicho ou tipo de empresa</span>
              <div><Search size={17} /><input value={form.query} onChange={(e) => update('query', e.target.value)} placeholder="Ex.: clínicas odontológicas" required /></div>
            </label>
            <label className="field-shell">
              <span>Cidade</span>
              <div><MapPin size={17} /><input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="São Paulo" required /></div>
            </label>
            <label className="field-shell">
              <span>Bairro ou região <em>opcional</em></span>
              <div><Building2 size={17} /><input value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="Ex.: Pinheiros" /></div>
            </label>
          </div>
        </div>

        <div className="builder-section">
          <div className="builder-step"><span>2</span><div><strong>Quais serviços você quer vender?</strong><small>Selecione uma ou várias oportunidades para combinar a qualificação</small></div></div>
          <div className="need-grid">
            {NEEDS.map(({ id, label, hint, icon: Icon }) => (
              <button type="button" aria-pressed={form.needs.includes(id)} key={id} className={`need-card ${form.needs.includes(id) ? 'selected' : ''}`} onClick={() => toggleNeed(id)}>
                <span className="need-icon"><Icon size={19} /></span><span><strong>{label}</strong><small>{hint}</small></span>{form.needs.includes(id) && <Check className="need-check" size={15} />}
              </button>
            ))}
          </div>
        </div>

        <div className="advanced-wrap">
          <button type="button" className="advanced-toggle" onClick={() => setAdvanced((value) => !value)}><SlidersHorizontal size={16} /> Ajustar filtros avançados <ChevronDown size={15} className={advanced ? 'rotated' : ''} /></button>
          {advanced && <div className="advanced-grid">
            <label><span>Raio</span><select value={form.radius} onChange={(e) => update('radius', e.target.value)}><option value="5">5 km</option><option value="15">15 km</option><option value="30">30 km</option><option value="50">50 km</option></select></label>
            <label><span>Mínimo de avaliações</span><select value={form.minReviews} onChange={(e) => update('minReviews', e.target.value)}><option value="0">Qualquer volume</option><option value="10">10+</option><option value="30">30+</option><option value="100">100+</option></select></label>
            <label><span>Nota máxima</span><select value={form.maxRating} onChange={(e) => update('maxRating', e.target.value)}><option value="">Qualquer nota</option><option value="4">Até 4,0</option><option value="4.3">Até 4,3</option><option value="4.6">Até 4,6</option></select></label>
            <label><span>Quantidade exata (1 a 100)</span><input className="advanced-number" type="number" min="1" max="100" value={form.limit} onChange={(e) => update('limit', e.target.value)} onBlur={() => update('limit', String(Math.min(Math.max(Number(form.limit) || 20, 1), 100)))} /></label>
            <label><span>Ordem dos resultados</span><select value={form.sortMode} onChange={(e) => update('sortMode', e.target.value)}>{SORT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="check-field"><input type="checkbox" checked={form.onlyNoWebsite} onChange={(e) => update('onlyNoWebsite', e.target.checked)} /><span>Somente empresas sem site</span></label>
            <label className="check-field"><input type="checkbox" checked={form.onlyNoInstagram} onChange={(e) => update('onlyNoInstagram', e.target.checked)} /><span>Instagram não identificado</span></label>
            <label className="check-field"><input type="checkbox" checked={form.excludeSaved} onChange={(e) => update('excludeSaved', e.target.checked)} /><span>Ocultar empresas já capturadas</span></label>
          </div>}
        </div>

        {error && <div className="inline-error">{error}</div>}
        <div className="builder-action">
          <div><strong>Busca pronta</strong><span>{form.query || 'Seu nicho'} · {form.city}{form.region ? `, ${form.region}` : ''} · {selectedNeeds.map((item) => item.label).join(' + ')}</span></div>
          <button className="launch-search" disabled={loading || !form.query.trim() || !form.city.trim()}>{loading ? <><LoaderCircle className="spin" size={18} /> Qualificando empresas...</> : <>Encontrar oportunidades <ArrowRight size={18} /></>}</button>
        </div>
      </form>

      {summary && !loading && <section className="search-results" ref={resultsRef}>
        <div className="results-heading"><div><span className="eyebrow"><Check size={13} /> Busca concluída</span><h2>{summary.count} de {summary.requested} oportunidades encontradas</h2><p>{summary.shortfall ? `Foram encontrados ${summary.count} perfis únicos que atendem aos filtros. ` : ''}Você pode mudar a ordem abaixo sem refazer a busca.</p></div><span className={`source-badge ${summary.realData ? 'real' : ''}`}>{summary.realData ? 'Dados do Google Places' : 'Modo demonstração'}</span></div>
        <div className="results-toolbar"><label><span>Priorizar</span><select value={form.sortMode} onChange={(e) => update('sortMode', e.target.value)}>{SORT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><small>O Maps não fornece Instagram; o sistema valida somente links públicos encontrados no site oficial.</small></div>
        <div className="bulk-toolbar">
          <label className="bulk-check"><input type="checkbox" checked={allSelected} onChange={toggleAll} /> <span>{allSelected ? 'Desmarcar todos' : `Selecionar todos (${selectableIds.length})`}</span></label>
          <select value={folderId} onChange={(event) => setFolderId(event.target.value)} aria-label="Escolher pasta"><option value="">Escolher pasta</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name} ({folder.leadIds.length})</option>)}</select>
          <div className="folder-create"><input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Nova pasta" maxLength={60} /><button type="button" onClick={createFolder} disabled={bulkBusy || !newFolderName.trim()} aria-label="Criar pasta"><FolderPlus size={16} /></button></div>
          <button type="button" className="bulk-primary" onClick={saveSelection} disabled={bulkBusy || !selectedIds.length}>Salvar {selectedIds.length || ''} na pasta</button>
          <button type="button" className="bulk-ai" onClick={prioritizeSelection} disabled={bulkBusy || !selectedIds.length}>{bulkBusy ? <LoaderCircle className="spin" size={15} /> : <WandSparkles size={15} />} Priorizar com IA</button>
          <small>Os resultados já ficam no CRM; a seleção organiza os escolhidos.</small>
        </div>
        {bulkMessage && <div className="bulk-feedback">{bulkMessage}</div>}
        {aiResult && <div className="ai-priority-panel"><div><strong>Ordem sugerida pela IA</strong><span>{aiResult.provider === 'gemini' ? 'Gemini' : 'Análise local'}</span></div><p>{aiResult.summary}</p><ol>{aiResult.recommendations.slice(0, 10).map((item) => { const lead = results.find((entry) => String(entry.id) === String(item.leadId)); return <li key={item.leadId}><strong>{lead?.name || 'Empresa'} · {item.score}/100</strong><span>{item.reason}</span><small>{item.approach}</small></li>; })}</ol></div>}
        <div className="results-list">
          {sortedResults.map((lead, index) => {
            const qualification = qualificationOf(lead);
            return <article className={`result-row ${selectedIds.includes(String(lead.id)) ? 'selected' : ''}`} key={lead.id || lead.place_id || index} onClick={() => lead.id && onSelectLead(lead.id)}>
            <label className="result-select" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(String(lead.id))} onChange={() => toggleSelected(lead.id)} aria-label={`Selecionar ${lead.name}`} /></label>
            <span className="result-rank">{String(index + 1).padStart(2, '0')}</span>
            <span className="result-company"><strong>{lead.name}</strong><small><MapPin size={12} /> {lead.address || lead.city}</small></span>
            <span className="result-signal"><Star size={14} /> {lead.rating || '—'} <small>({lead.reviews_count || 0})</small></span>
            <span className="result-gaps">{!lead.website && <i>Sem site</i>}<i className={`difficulty-${String(qualification.difficultyLabel || '').toLowerCase()}`}>{qualification.difficultyLabel || 'Analisar'}</i></span>
            <span className="result-score"><small>Vulnerável</small><strong>{qualification.vulnerabilityScore ?? lead.opportunity_score ?? 0}</strong></span>
            <ArrowRight size={17} />
          </article>})}
        </div>
      </section>}

      <section className="saved-searches-section">
        <div className="saved-searches-title"><div><span className="eyebrow"><Clock3 size={13} /> Histórico salvo</span><h2>Buscas recentes</h2></div><span>{savedSearches.length} salvas</span></div>
        {savedSearches.length === 0 ? <p className="directory-empty">Suas buscas aparecerão aqui automaticamente.</p> : (
          <div className="saved-searches-list">{savedSearches.slice(0, 8).map((item) => (
            <button type="button" key={item.id} onClick={() => openSavedSearch(item)}><div><strong>{item.query}</strong><small>{item.city}{item.region ? ` · ${item.region}` : ''}</small></div><div className="saved-search-needs">{(item.needs || []).map((need) => <i key={need}>{NEEDS.find((entry) => entry.id === need)?.label || need}</i>)}</div><div><strong>{item.found}/{item.requested}</strong><small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small></div><ArrowRight size={16} /></button>
          ))}</div>
        )}
      </section>
    </div>
  );
}
