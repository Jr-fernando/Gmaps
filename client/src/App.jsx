import React, { useState } from 'react';
import './App.css';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import CRMBoardPage from './pages/CRMBoardPage';
import SettingsPage from './pages/SettingsPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [triggeringAutomation, setTriggeringAutomation] = useState(false);

  const handleTriggerAutomation = async () => {
    setTriggeringAutomation(true);
    try {
      const res = await fetch('/api/automation/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao disparar automações de follow-up.');
    } finally {
      setTriggeringAutomation(false);
    }
  };

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
    <MainLayout
      currentView={currentView}
      onViewChange={(view) => {
        setSelectedLeadId(null);
        setCurrentView(view);
      }}
      title={getViewTitle()}
      triggerAutomation={handleTriggerAutomation}
      triggeringAutomation={triggeringAutomation}
    >
      {selectedLeadId ? (
        <CompanyDetailsPage 
          leadId={selectedLeadId}
          onBack={() => setSelectedLeadId(null)}
          onLeadUpdated={() => setRefreshTrigger(prev => prev + 1)}
        />
      ) : (
        <>
          {currentView === 'dashboard' && <DashboardPage />}
          {currentView === 'search' && (
            <SearchPage 
              onSearchComplete={() => setRefreshTrigger(prev => prev + 1)} 
              onSelectLead={(id) => setSelectedLeadId(id)}
            />
          )}
          {currentView === 'crm' && (
            <CRMBoardPage 
              onSelectLead={(id) => setSelectedLeadId(id)} 
              refreshTrigger={refreshTrigger}
            />
          )}
          {currentView === 'settings' && <SettingsPage />}
        </>
      )}
    </MainLayout>
  );
}
