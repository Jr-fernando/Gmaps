import React, { useEffect, useState } from 'react';
import { Save, Key, Sliders, Bell, Share2, Info } from 'lucide-react';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    gemini_api_key: '',
    openai_api_key: '',
    claude_api_key: '',
    google_places_api_key: '',
    whatsapp_webhook_url: '',
    telegram_webhook_url: '',
    notion_api_key: '',
    notion_database_id: '',
    google_sheets_url: '',
    follow_up_day_2: '',
    follow_up_day_5: '',
    follow_up_day_10: '',
    fast_follow_up_mode: 'false'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar configurações:', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Configurações salvas com sucesso!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <form onSubmit={handleSave}>
        
        {/* API Credentials */}
        <div className="glass-card settings-section">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} /> Credenciais e Chaves de API
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Configure suas chaves de API para utilizar inteligência artificial real e buscas automáticas no Google Maps. Se deixadas vazias, o sistema usará motores de simulação inteligentes integrados.
          </p>

          <div className="settings-row">
            <div className="input-group">
              <label className="input-label">Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                className="input-field"
                value={settings.gemini_api_key || ''}
                onChange={(e) => handleChange('gemini_api_key', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">OpenAI API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                className="input-field"
                value={settings.openai_api_key || ''}
                onChange={(e) => handleChange('openai_api_key', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="input-group">
              <label className="input-label">Claude (Anthropic) API Key</label>
              <input
                type="password"
                placeholder="sk-ant-..."
                className="input-field"
                value={settings.claude_api_key || ''}
                onChange={(e) => handleChange('claude_api_key', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Google Places API Key</label>
              <input
                type="password"
                placeholder="Chave de busca do Google Maps..."
                className="input-field"
                value={settings.google_places_api_key || ''}
                onChange={(e) => handleChange('google_places_api_key', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Prospecting Rules */}
        <div className="glass-card settings-section">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} /> Templates de Prospecção & Automação
          </h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
            <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span>Use os marcadores <strong>[Nome]</strong> (nome do lead) e <strong>[Empresa]</strong> (nome da empresa) nos templates. Eles serão substituídos dinamicamente!</span>
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label">Mensagem de Cobrança 1 (D+2 dias)</label>
            <textarea
              className="message-textarea"
              style={{ height: '90px' }}
              value={settings.follow_up_day_2 || ''}
              onChange={(e) => handleChange('follow_up_day_2', e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label">Mensagem de Cobrança 2 (D+5 dias)</label>
            <textarea
              className="message-textarea"
              style={{ height: '90px' }}
              value={settings.follow_up_day_5 || ''}
              onChange={(e) => handleChange('follow_up_day_5', e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label className="input-label">Mensagem de Cobrança 3 (D+10 dias)</label>
            <textarea
              className="message-textarea"
              style={{ height: '90px' }}
              value={settings.follow_up_day_10 || ''}
              onChange={(e) => handleChange('follow_up_day_10', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifySpace: 'space-between', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Modo de Simulação Rápida (Testes)</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quando ativado, os follow-ups são agendados em **minutos** em vez de **dias** (Ex: D+2 agenda para daqui a 2 minutos). Excelente para validar o funcionamento do scheduler local.</span>
            </div>
            <select 
              value={settings.fast_follow_up_mode} 
              onChange={(e) => handleChange('fast_follow_up_mode', e.target.value)}
              className="filter-select"
              style={{ marginLeft: '20px' }}
            >
              <option value="false">Desativado (Dias)</option>
              <option value="true">Ativado (Minutos)</option>
            </select>
          </div>
        </div>

        {/* Webhooks / Integrations */}
        <div className="glass-card settings-section">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} /> Integrações Externas (Webhooks)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Integre o AgenticLeads com plataformas de automação como Make.com, Zapier ou N8N enviando webhooks em tempo real ao disparar contatos.
          </p>

          <div className="settings-row">
            <div className="input-group">
              <label className="input-label">WhatsApp Disparador Webhook URL</label>
              <input
                type="text"
                placeholder="https://hook.us1.make.com/..."
                className="input-field"
                value={settings.whatsapp_webhook_url || ''}
                onChange={(e) => handleChange('whatsapp_webhook_url', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Telegram Notification Webhook URL</label>
              <input
                type="text"
                placeholder="https://api.telegram.org/bot..."
                className="input-field"
                value={settings.telegram_webhook_url || ''}
                onChange={(e) => handleChange('telegram_webhook_url', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="input-group">
              <label className="input-label">Notion Integration Token</label>
              <input
                type="password"
                placeholder="secret_..."
                className="input-field"
                value={settings.notion_api_key || ''}
                onChange={(e) => handleChange('notion_api_key', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Notion Database ID</label>
              <input
                type="text"
                placeholder="ID da tabela no Notion..."
                className="input-field"
                value={settings.notion_database_id || ''}
                onChange={(e) => handleChange('notion_database_id', e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Google Sheets URL para Exportação</label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="input-field"
              value={settings.google_sheets_url || ''}
              onChange={(e) => handleChange('google_sheets_url', e.target.value)}
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center', marginBottom: '40px' }}>
          {successMsg && (
            <span style={{ color: 'var(--color-success)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {successMsg}
            </span>
          )}
          
          <button type="submit" className="btn-save-settings" disabled={saving}>
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

      </form>
    </div>
  );
}
