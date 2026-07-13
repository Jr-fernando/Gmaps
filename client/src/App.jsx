import React from 'react';
import './App.css';
import { AppProvider, useApp } from './contexts/AppContext';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import CRMBoardPage from './pages/CRMBoardPage';
import SettingsPage from './pages/SettingsPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';

function AppInner() {
  const {
    currentView,
    selectedLeadId,
    refreshTrigger,
    triggeringAutomation,
    onViewChange,
    onSelectLead,
    triggerRefresh,
    triggerAutomation,
    title
  } = useApp();

  return (
    <MainLayout
      currentView={currentView}
      onViewChange={onViewChange}
      title={title}
      triggerAutomation={triggerAutomation}
      triggeringAutomation={triggeringAutomation}
    >
      {selectedLeadId ? (
        <CompanyDetailsPage 
          leadId={selectedLeadId}
          onBack={() => onViewChange(currentView)}
          onLeadUpdated={triggerRefresh}
        />
      ) : (
        <>
          {currentView === 'dashboard' && <DashboardPage />}
          {currentView === 'search' && (
            <SearchPage 
              onSearchComplete={triggerRefresh} 
              onSelectLead={onSelectLead}
            />
          )}
          {currentView === 'crm' && (
            <CRMBoardPage 
              onSelectLead={onSelectLead} 
              refreshTrigger={refreshTrigger}
            />
          )}
          {currentView === 'settings' && <SettingsPage />}
        </>
      )}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
