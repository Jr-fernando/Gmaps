import React, { createContext, useContext, useState, useCallback } from 'react';
import { automationService } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [triggeringAutomation, setTriggeringAutomation] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const onViewChange = useCallback((view) => {
    setSelectedLeadId(null);
    setCurrentView(view);
  }, []);

  const onSelectLead = useCallback((id) => {
    setSelectedLeadId(id);
  }, []);

  const handleTriggerAutomation = useCallback(async () => {
    setTriggeringAutomation(true);
    try {
      const data = await automationService.triggerAutomation();
      if (data.success) {
        alert(data.message);
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao disparar automações de follow-up.');
    } finally {
      setTriggeringAutomation(false);
    }
  }, [triggerRefresh]);

  const getViewTitle = () => {
    if (selectedLeadId) {
      return 'Perfil Detalhado da Empresa';
    }
    switch (currentView) {
      case 'dashboard': return 'Painel de Controle';
      case 'search': return 'Busca Ativa de Empresas';
      case 'crm': return 'Funil de Vendas CRM';
      case 'settings': return 'Configurações e Integrações';
      default: return 'AgenticLeads';
    }
  };

  return (
    <AppContext.Provider value={{
      currentView,
      selectedLeadId,
      refreshTrigger,
      triggeringAutomation,
      onViewChange,
      onSelectLead,
      triggerRefresh,
      triggerAutomation: handleTriggerAutomation,
      title: getViewTitle()
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
