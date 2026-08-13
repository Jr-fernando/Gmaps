import React, { useEffect, useState } from 'react';
import './App.css';
import { AppProvider } from './contexts/AppContext';
import { useApp } from './contexts/contextStore';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import CRMBoardPage from './pages/CRMBoardPage';
import CompaniesPage from './pages/CompaniesPage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import LoginPage from './pages/LoginPage';
import AppErrorBoundary from './components/AppErrorBoundary';
import { authService } from './services/api';

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
      <>
        {currentView === 'search' && (
          <div hidden={Boolean(selectedLeadId)}>
            <SearchPage
              onSearchComplete={triggerRefresh}
              onSelectLead={onSelectLead}
            />
          </div>
        )}
        {selectedLeadId ? (
          <AppErrorBoundary onRecover={() => onViewChange(currentView)}>
            <CompanyDetailsPage
              leadId={selectedLeadId}
              onBack={() => onViewChange(currentView)}
              onLeadUpdated={triggerRefresh}
            />
          </AppErrorBoundary>
        ) : (
          <>
          {currentView === 'dashboard' && <DashboardPage onNavigate={onViewChange} />}
          {currentView === 'crm' && (
            <CRMBoardPage 
              onSelectLead={onSelectLead} 
              refreshTrigger={refreshTrigger}
            />
          )}
          {currentView === 'companies' && (
            <CompaniesPage onSelectLead={onSelectLead} refreshTrigger={refreshTrigger} />
          )}
          {currentView === 'settings' && <SettingsPage />}
          {currentView === 'messages' && <MessagesPage onLeadUpdated={triggerRefresh} />}
          </>
        )}
      </>
    </MainLayout>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    authService.session()
      .then(({ authenticated: isAuthenticated }) => setAuthenticated(isAuthenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) {
    return <div className="app-loading"><div className="loader-spinner" /></div>;
  }
  if (!authenticated) {
    return <LoginPage onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
