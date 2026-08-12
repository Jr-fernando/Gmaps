import { useMemo, useState } from 'react';
import {
  ArrowRight, Building2, Check, ChevronDown, Globe2, Instagram, LoaderCircle,
  MapPin, MessageCircle, Search, SlidersHorizontal, Sparkles, Star, Target
} from 'lucide-react';
import { leadService, settingsService } from '../services/api';

const NEEDS = [
  { id: 'social_media', label: 'Social media', hint: 'Instagram ausente ou fraco', icon: Instagram },
  { id: 'website', label: 'Site ou landing page', hint: 'Sem site ou experiência ruim', icon: Globe2 },
  { id: 'whatsapp', label: 'WhatsApp e automação', hint: 'Atendimento sem conversão', icon: MessageCircle },
  { id: 'traffic', label: 'Tráfego pago', hint: 'Boa reputação, pouca aquisição', icon: Target },
];

const INITIAL = {
  query: '', city: 'São Paulo', region: '', radius: '15', need: 'social_media',
  minReviews: '10', maxRating: '', onlyNoWebsite: false, onlyNoInstagram: false, limit: '20'
};

export default function SearchPage({ onSearchComplete, onSelectLead }) {
  const [form, setForm] = useState(INITIAL);
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const selectedNeed = useMemo(() => NEEDS.find((item) => item.id === form.need), [form.need]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const settings = await settingsService.getSettings().catch(() => ({}));
      const data = await leadService.searchLeads({
        query: form.query,
        city: form.city,
        region: form.region,
        radius: Number(form.radius),
        need: form.need,
        minReviews: Number(form.minReviews || 0),
        maxRating: form.maxRating ? Number(form.maxRating) : undefined,
        onlyNoWebsite: form.onlyNoWebsite,
        onlyNoInstagram: form.onlyNoInstagram,
        limit: Number(form.limit),
      });
      setResults(data.leads || []);
      setSummary({
        count: data.leads?.length || 0,
        realData: Boolean(settings.google_places_api_key_configured),
        need: selectedNeed?.label,
      });
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
          <div className="builder-step"><span>2</span><div><strong>Qual oportunidade você quer vender?</strong><small>A qualificação prioriza empresas com essa necessidade</small></div></div>
          <div className="need-grid">
            {NEEDS.map(({ id, label, hint, icon: Icon }) => (
              <button type="button" key={id} className={`need-card ${form.need === id ? 'selected' : ''}`} onClick={() => update('need', id)}>
                <span className="need-icon"><Icon size={19} /></span><span><strong>{label}</strong><small>{hint}</small></span>{form.need === id && <Check className="need-check" size={15} />}
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
            <label><span>Quantidade</span><select value={form.limit} onChange={(e) => update('limit', e.target.value)}><option value="10">Até 10</option><option value="20">Até 20</option><option value="40">Até 40</option></select></label>
            <label className="check-field"><input type="checkbox" checked={form.onlyNoWebsite} onChange={(e) => update('onlyNoWebsite', e.target.checked)} /><span>Somente empresas sem site</span></label>
            <label className="check-field"><input type="checkbox" checked={form.onlyNoInstagram} onChange={(e) => update('onlyNoInstagram', e.target.checked)} /><span>Somente empresas sem Instagram</span></label>
          </div>}
        </div>

        {error && <div className="inline-error">{error}</div>}
        <div className="builder-action">
          <div><strong>Busca pronta</strong><span>{form.query || 'Seu nicho'} · {form.city}{form.region ? `, ${form.region}` : ''} · {selectedNeed?.label}</span></div>
          <button className="launch-search" disabled={loading || !form.query.trim() || !form.city.trim()}>{loading ? <><LoaderCircle className="spin" size={18} /> Qualificando empresas...</> : <>Encontrar oportunidades <ArrowRight size={18} /></>}</button>
        </div>
      </form>

      {summary && !loading && <section className="search-results">
        <div className="results-heading"><div><span className="eyebrow"><Check size={13} /> Busca concluída</span><h2>{summary.count} oportunidades encontradas</h2><p>Ordenadas pela aderência à oferta de {summary.need.toLowerCase()}.</p></div><span className={`source-badge ${summary.realData ? 'real' : ''}`}>{summary.realData ? 'Dados do Google Places' : 'Modo demonstração'}</span></div>
        <div className="results-list">
          {results.map((lead, index) => <button type="button" className="result-row" key={lead.id || index} onClick={() => lead.id && onSelectLead(lead.id)}>
            <span className="result-rank">{String(index + 1).padStart(2, '0')}</span>
            <span className="result-company"><strong>{lead.name}</strong><small><MapPin size={12} /> {lead.address || lead.city}</small></span>
            <span className="result-signal"><Star size={14} /> {lead.rating || '—'} <small>({lead.reviews_count || 0})</small></span>
            <span className="result-gaps">{!lead.website && <i>Sem site</i>}{!lead.instagram && <i>Sem Instagram</i>}</span>
            <span className="result-score"><small>Oportunidade</small><strong>{lead.opportunity_score || 0}</strong></span>
            <ArrowRight size={17} />
          </button>)}
        </div>
      </section>}
    </div>
  );
}
