import React, { useState } from 'react';
import { LayoutDashboard, Search, Kanban, Settings, RefreshCw, Layers } from 'lucide-react';
import './App.css';

// Views
import DashboardView from './components/DashboardView';
import SearchView from './components/SearchView';
import CRMBoardView from './components/CRMBoardView';
import SettingsView from './components/SettingsView';
import CompanyDetailsView from './components/CompanyDetailsView';

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
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <Layers size={20} />
          </div>
          <span className="logo-text">AgenticLeads</span>
        </div>

        <ul className="nav-links">
          <li>
            <a 
              className={`nav-item ${currentView === 'dashboard' && !selectedLeadId ? 'active' : ''}`}
              onClick={() => {
                setSelectedLeadId(null);
                setCurrentView('dashboard');
              }}
            >
              <LayoutDashboard size={18} />
              Painel
            </a>
          </li>
          <li>
            <a 
              className={`nav-item ${currentView === 'search' && !selectedLeadId ? 'active' : ''}`}
              onClick={() => {
                setSelectedLeadId(null);
                setCurrentView('search');
              }}
            >
              <Search size={18} />
              Busca Ativa
            </a>
          </li>
          <li>
            <a 
              className={`nav-item ${currentView === 'crm' && !selectedLeadId ? 'active' : ''}`}
              onClick={() => {
                setSelectedLeadId(null);
                setCurrentView('crm');
              }}
            >
              <Kanban size={18} />
              CRM Kanban
            </a>
          </li>
          <li>
            <a 
              className={`nav-item ${currentView === 'settings' && !selectedLeadId ? 'active' : ''}`}
              onClick={() => {
                setSelectedLeadId(null);
                setCurrentView('settings');
              }}
            >
              <Settings size={18} />
              Configurações
            </a>
          </li>
        </ul>

        <div className="sidebar-footer">
          <p>AgenticLeads CRM v1.0.0</p>
          <p style={{ fontSize: '0.7rem' }}>Focado em Prospecção Digital</p>
        </div>
      </aside>

      {/* Main Panel Wrapper */}
      <main className="main-content">
        
        {/* Top Header Bar */}
        <header className="top-bar">
          <h2 className="page-title">{getViewTitle()}</h2>
          
          <div className="top-bar-actions">
            <button 
              className="btn-trigger-cron" 
              onClick={handleTriggerAutomation}
              disabled={triggeringAutomation}
            >
              <RefreshCw size={14} className={triggeringAutomation ? 'spin' : ''} />
              {triggeringAutomation ? 'Processando...' : 'Rodar Automações'}
            </button>
          </div>
        </header>

        {/* Content Render Area */}
        <div className="content-wrapper">
          {selectedLeadId ? (
            <CompanyDetailsView 
              leadId={selectedLeadId}
              onBack={() => setSelectedLeadId(null)}
              onLeadUpdated={() => setRefreshTrigger(prev => prev + 1)}
            />
          ) : (
            <>
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'search' && <SearchView onSearchComplete={() => setRefreshTrigger(prev => prev + 1)} />}
              {currentView === 'crm' && (
                <CRMBoardView 
                  onSelectLead={(id) => setSelectedLeadId(id)} 
                  refreshTrigger={refreshTrigger}
                />
              )}
              {currentView === 'settings' && <SettingsView />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
