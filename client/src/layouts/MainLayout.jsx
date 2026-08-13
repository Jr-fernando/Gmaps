import { useEffect, useRef } from 'react';
import { BarChart3, Building2, Kanban, MapPinned, MessageCircle, RefreshCw, Search, Settings, Sparkles } from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Visão geral', icon: BarChart3 },
  { id: 'search', label: 'Encontrar clientes', icon: Search, primary: true },
  { id: 'companies', label: 'Leads capturados', icon: Building2 },
  { id: 'messages', label: 'Chat e mensagens', icon: MessageCircle },
  { id: 'crm', label: 'Pipeline', icon: Kanban },
];

export default function MainLayout({ children, currentView, onViewChange, title, triggerAutomation, triggeringAutomation }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.scrollTop = 0;
    contentRef.current.scrollLeft = 0;
  }, [currentView, title]);

  return <div className="app-container">
    <aside className="sidebar">
      <button className="brand" onClick={() => onViewChange('dashboard')}>
        <span><MapPinned size={21} /></span><div><strong>LeadMap</strong><small>prospecção local</small></div>
      </button>
      <div className="nav-label">Workspace</div>
      <nav className="nav-links">
        {NAV.map(({ id, label, icon: Icon, primary }) => <button key={id} className={`nav-item ${currentView === id ? 'active' : ''} ${primary ? 'nav-primary' : ''}`} onClick={() => onViewChange(id)}><Icon size={17} /><span>{label}</span>{primary && <Sparkles size={13} className="nav-spark" />}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <button className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => onViewChange('settings')}><Settings size={17} /><span>Configurações</span></button>
        <div className="workspace-status"><i /><div><strong>Workspace ativo</strong><small>Dados protegidos</small></div></div>
      </div>
    </aside>
    <main className="main-content">
      <header className="top-bar"><div><span className="top-context">LeadMap /</span><h2 className="page-title">{title}</h2></div><button className="automation-button" onClick={triggerAutomation} disabled={triggeringAutomation}><RefreshCw size={14} className={triggeringAutomation ? 'spin' : ''} />{triggeringAutomation ? 'Processando...' : 'Executar follow-ups'}</button></header>
      <div className="content-wrapper" ref={contentRef}>{children}</div>
    </main>
  </div>;
}
