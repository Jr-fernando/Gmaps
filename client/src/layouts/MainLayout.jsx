import React from 'react';
import { LayoutDashboard, Search, Kanban, Settings, RefreshCw, Layers } from 'lucide-react';

export default function MainLayout({ children, currentView, onViewChange, title, triggerAutomation, triggeringAutomation }) {
  return (
    <div className="app-container animate-fade-in">
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
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onViewChange('dashboard')}
            >
              <LayoutDashboard size={18} />
              Painel
            </a>
          </li>
          <li>
            <a 
              className={`nav-item ${currentView === 'search' ? 'active' : ''}`}
              onClick={() => onViewChange('search')}
            >
              <Search size={18} />
              Busca Ativa
            </a>
          </li>
          <li>
            <a 
              className={`nav-item ${currentView === 'crm' ? 'active' : ''}`}
              onClick={() => onViewChange('crm')}
            >
              <Kanban size={18} />
              CRM Kanban
            </a>
          </li>
          <li>
            <a 
              className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => onViewChange('settings')}
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
          <h2 className="page-title">{title}</h2>
          
          <div className="top-bar-actions">
            <button 
              className="btn-trigger-cron" 
              onClick={triggerAutomation}
              disabled={triggeringAutomation}
            >
              <RefreshCw size={14} className={triggeringAutomation ? 'spin' : ''} />
              {triggeringAutomation ? 'Processando...' : 'Rodar Automações'}
            </button>
          </div>
        </header>

        {/* Content Render Area */}
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
