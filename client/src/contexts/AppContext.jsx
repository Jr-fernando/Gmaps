import { useCallback, useState } from 'react';
import { automationService } from '../services/api';
import { AppContext } from './contextStore';

export const AppProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [triggeringAutomation, setTriggeringAutomation] = useState(false);
  const triggerRefresh = useCallback(() => setRefreshTrigger((value) => value + 1), []);
  const onViewChange = useCallback((view) => { setSelectedLeadId(null); setCurrentView(view); }, []);
  const onSelectLead = useCallback((id) => setSelectedLeadId(id), []);
  const triggerAutomation = useCallback(async () => {
    setTriggeringAutomation(true);
    try { const data = await automationService.triggerAutomation(); if (data.success) { alert(data.message); triggerRefresh(); } }
    catch (error) { alert(error.message || 'Não foi possível executar os follow-ups.'); }
    finally { setTriggeringAutomation(false); }
  }, [triggerRefresh]);
  const titles = { dashboard: 'Visão geral', search: 'Encontrar clientes', companies: 'Leads capturados', messages: 'Chat e mensagens', crm: 'Pipeline comercial', settings: 'Configurações' };
  const title = selectedLeadId ? 'Perfil da empresa' : (titles[currentView] || 'LeadMap');
  return <AppContext.Provider value={{ currentView, selectedLeadId, refreshTrigger, triggeringAutomation, onViewChange, onSelectLead, triggerRefresh, triggerAutomation, title }}>{children}</AppContext.Provider>;
};
