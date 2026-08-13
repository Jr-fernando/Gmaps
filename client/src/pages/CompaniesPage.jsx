import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, ExternalLink, Folder, FolderPlus, Globe, LoaderCircle, MailCheck, MailQuestion, MapPin, Search, Star, Trash2, WandSparkles } from 'lucide-react';
import useLeads from '../hooks/useLeads';
import Card from '../components/common/Card';
import { folderService, leadService, searchService } from '../services/api';

const isSent = (lead) => !['Novo Lead', 'Entrar em contato'].includes(lead.status || 'Novo Lead');

export default function CompaniesPage({ onSelectLead, refreshTrigger }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [segment, setSegment] = useState('');
  const [searchId, setSearchId] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
  const [savedSearches, setSavedSearches] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderFilter, setFolderFilter] = useState('');
  const [targetFolder, setTargetFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const { leads, loading, cities, segments, updateLeadStatus } = useLeads({}, refreshTrigger);

  const refreshFolders = () => folderService.getAll().then((data) => setFolders(Array.isArray(data) ? data : [])).catch(() => setFolders([]));
  useEffect(() => {
    Promise.all([
      searchService.getSaved().then((data) => setSavedSearches(Array.isArray(data) ? data : [])).catch(() => setSavedSearches([])),
      refreshFolders(),
    ]).catch(() => {});
  }, [refreshTrigger]);

  const selectedSearchIds = useMemo(() => {
    if (!searchId) return null;
    const selected = savedSearches.find((item) => String(item.id) === searchId);
    return new Set((selected?.leadIds || []).map(String));
  }, [savedSearches, searchId]);
  const selectedFolderIds = useMemo(() => {
    if (!folderFilter) return null;
    return new Set((folders.find((folder) => folder.id === folderFilter)?.leadIds || []).map(String));
  }, [folders, folderFilter]);
  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    const haystack = `${lead.name || ''} ${lead.description || ''} ${lead.category || ''} ${lead.segment || ''}`.toLocaleLowerCase('pt-BR');
    if (term && !haystack.includes(term)) return false;
    if (city && lead.city !== city) return false;
    if (segment && lead.segment !== segment && lead.category !== segment) return false;
    if (selectedSearchIds && !selectedSearchIds.has(String(lead.id))) return false;
    if (selectedFolderIds && !selectedFolderIds.has(String(lead.id))) return false;
    return true;
  }), [leads, query, city, segment, selectedSearchIds, selectedFolderIds]);
  const summary = useMemo(() => ({
    total: filteredLeads.length,
    sent: filteredLeads.filter(isSent).length,
    pending: filteredLeads.filter((lead) => !isSent(lead)).length,
  }), [filteredLeads]);
  const visibleLeads = useMemo(() => filteredLeads.filter((lead) => contactFilter === 'all' || (contactFilter === 'sent' ? isSent(lead) : !isSent(lead))), [filteredLeads, contactFilter]);
  const visibleIds = visibleLeads.map((lead) => String(lead.id));
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleSelected = (id) => setSelectedIds((current) => current.includes(String(id)) ? current.filter((item) => item !== String(id)) : [...current, String(id)]);
  const toggleAll = () => setSelectedIds(allSelected ? selectedIds.filter((id) => !visibleIds.includes(id)) : [...new Set([...selectedIds, ...visibleIds])]);
  const toggleSent = async (lead) => updateLeadStatus(lead.id, isSent(lead) ? 'Novo Lead' : 'Mensagem enviada');

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setBulkBusy(true); setFeedback('');
    try {
      const folder = await folderService.create(newFolderName);
      await refreshFolders(); setTargetFolder(folder.id); setNewFolderName(''); setFeedback(`Pasta “${folder.name}” criada.`);
    } catch (err) { setFeedback(err.message); }
    finally { setBulkBusy(false); }
  };
  const addToFolder = async () => {
    if (!selectedIds.length || !targetFolder) return setFeedback('Selecione empresas e uma pasta de destino.');
    setBulkBusy(true); setFeedback('');
    try {
      const updated = await folderService.addLeads(targetFolder, selectedIds);
      await refreshFolders(); setFeedback(`${selectedIds.length} empresa${selectedIds.length === 1 ? '' : 's'} adicionada${selectedIds.length === 1 ? '' : 's'} à pasta “${updated.name}”.`);
    } catch (err) { setFeedback(err.message); }
    finally { setBulkBusy(false); }
  };
  const removeFromCurrentFolder = async () => {
    if (!folderFilter || !selectedIds.length) return;
    setBulkBusy(true); setFeedback('');
    try { await folderService.removeLeads(folderFilter, selectedIds); await refreshFolders(); setSelectedIds([]); setFeedback('Seleção removida da pasta.'); }
    catch (err) { setFeedback(err.message); }
    finally { setBulkBusy(false); }
  };
  const deleteCurrentFolder = async () => {
    if (!folderFilter) return;
    setBulkBusy(true); setFeedback('');
    try { await folderService.remove(folderFilter); setFolderFilter(''); await refreshFolders(); setFeedback('Pasta excluída. As empresas continuam salvas no CRM.'); }
    catch (err) { setFeedback(err.message); }
    finally { setBulkBusy(false); }
  };
  const prioritize = async () => {
    if (!selectedIds.length) return setFeedback('Selecione as empresas que a IA deve comparar.');
    setBulkBusy(true); setAiResult(null); setFeedback('');
    try { setAiResult(await leadService.prioritize(selectedIds, 'Priorizar empresas com maior chance de contratar serviços digitais e canal de contato verificável')); }
    catch (err) { setFeedback(err.message); }
    finally { setBulkBusy(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="company-directory-header"><div><h3>Base de empresas</h3><p>Selecione, organize em pastas e priorize os melhores contatos.</p></div><span className="directory-count">{summary.total} empresa{summary.total === 1 ? '' : 's'}</span></div>

      <div className="contact-summary-grid">
        <button type="button" className={contactFilter === 'all' ? 'active' : ''} onClick={() => setContactFilter('all')}><Building2 size={17} /><span><small>Total salvo</small><strong>{summary.total}</strong></span></button>
        <button type="button" className={contactFilter === 'pending' ? 'active' : ''} onClick={() => setContactFilter('pending')}><MailQuestion size={17} /><span><small>Não enviados</small><strong>{summary.pending}</strong></span></button>
        <button type="button" className={contactFilter === 'sent' ? 'active' : ''} onClick={() => setContactFilter('sent')}><MailCheck size={17} /><span><small>Já enviados</small><strong>{summary.sent}</strong></span></button>
      </div>

      <section className="folder-shelf">
        <div className="folder-shelf-title"><span><Folder size={16} /> Pastas</span><div className="folder-create"><input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Criar nova pasta" maxLength={60} /><button type="button" onClick={createFolder} disabled={bulkBusy || !newFolderName.trim()}><FolderPlus size={16} /> Criar</button></div></div>
        <div className="folder-chips"><button type="button" className={!folderFilter ? 'active' : ''} onClick={() => setFolderFilter('')}>Todas</button>{folders.map((folder) => <button type="button" className={folderFilter === folder.id ? 'active' : ''} key={folder.id} onClick={() => setFolderFilter(folder.id)}>{folder.name}<small>{folder.leadIds.length}</small></button>)}</div>
      </section>

      <Card className="directory-filters">
        <div className="directory-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa ou descrição" aria-label="Buscar empresas" /></div>
        <select value={city} onChange={(event) => setCity(event.target.value)}><option value="">Todas as cidades</option>{cities.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={segment} onChange={(event) => setSegment(event.target.value)}><option value="">Todos os nichos</option>{segments.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={searchId} onChange={(event) => setSearchId(event.target.value)}><option value="">Todas as buscas</option>{savedSearches.map((item) => <option key={item.id} value={item.id}>{item.query} · {item.city} · {item.found}/{item.requested}</option>)}</select>
      </Card>

      <div className="bulk-toolbar captured-bulk">
        <label className="bulk-check"><input type="checkbox" checked={allSelected} onChange={toggleAll} /><span>{allSelected ? 'Desmarcar visíveis' : `Selecionar visíveis (${visibleIds.length})`}</span></label>
        <select value={targetFolder} onChange={(event) => setTargetFolder(event.target.value)}><option value="">Pasta de destino</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
        <button type="button" className="bulk-primary" disabled={bulkBusy || !selectedIds.length || !targetFolder} onClick={addToFolder}>Adicionar {selectedIds.length || ''} à pasta</button>
        <button type="button" className="bulk-ai" disabled={bulkBusy || !selectedIds.length} onClick={prioritize}>{bulkBusy ? <LoaderCircle className="spin" size={15} /> : <WandSparkles size={15} />} Priorizar com IA</button>
        {folderFilter && <button type="button" className="bulk-secondary" disabled={bulkBusy || !selectedIds.length} onClick={removeFromCurrentFolder}>Remover da pasta</button>}
        {folderFilter && <button type="button" className="folder-delete" disabled={bulkBusy} onClick={deleteCurrentFolder} title="Excluir pasta"><Trash2 size={15} /></button>}
      </div>
      {feedback && <div className="bulk-feedback">{feedback}</div>}
      {aiResult && <div className="ai-priority-panel"><div><strong>Prioridade sugerida</strong><span>{aiResult.provider === 'gemini' ? 'Gemini' : 'Análise local'}</span></div><p>{aiResult.summary}</p><ol>{aiResult.recommendations.slice(0, 12).map((item) => { const lead = leads.find((entry) => String(entry.id) === item.leadId); return <li key={item.leadId}><strong>{lead?.name || 'Empresa'} · {item.score}/100</strong><span>{item.reason}</span><small>{item.approach}</small></li>; })}</ol></div>}

      {loading ? <p className="directory-empty">Carregando empresas...</p> : visibleLeads.length === 0 ? <p className="directory-empty">Nenhuma empresa encontrada com estes filtros.</p> : (
        <div className="company-directory-grid">{visibleLeads.map((lead) => (
          <article className={`company-directory-card ${selectedIds.includes(String(lead.id)) ? 'selected' : ''}`} key={lead.id} onClick={() => onSelectLead(lead.id)}>
            <div className="company-directory-card-top"><label className="card-select" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(String(lead.id))} onChange={() => toggleSelected(lead.id)} aria-label={`Selecionar ${lead.name}`} /></label><span className="company-directory-icon"><Building2 size={18} /></span><span className={`score-pill ${lead.opportunity_score >= 80 ? 'high' : ''}`}>{lead.opportunity_score || 0}/100</span></div>
            <strong>{lead.name}</strong><span className="company-directory-category">{lead.category || lead.segment || 'Empresa local'}</span>
            <span className="company-directory-detail"><MapPin size={14} />{lead.city || 'Localização não informada'}</span><span className="company-directory-detail"><Star size={14} />{lead.rating ? `${lead.rating} (${lead.reviews_count || 0} avaliações)` : 'Sem avaliações'}</span>
            <div className="company-directory-card-footer">{lead.website ? <span><Globe size={14} /> Site</span> : <span>Sem site</span>}<button type="button" onClick={(event) => { event.stopPropagation(); onSelectLead(lead.id); }}>Ver perfil <ExternalLink size={14} /></button></div>
            <button type="button" className={`sent-toggle ${isSent(lead) ? 'sent' : ''}`} onClick={(event) => { event.stopPropagation(); toggleSent(lead); }}><CheckCircle2 size={14} />{isSent(lead) ? 'Contato enviado' : 'Marcar como enviado'}</button>
          </article>
        ))}</div>
      )}
    </div>
  );
}
