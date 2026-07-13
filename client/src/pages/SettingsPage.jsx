import React from 'react';
import { Key, Sliders, Share2, Info } from 'lucide-react';
import useSettings from '../hooks/useSettings';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

export default function SettingsPage() {
  const {
    settings,
    loading,
    saving,
    successMsg,
    handleChange,
    handleTestWebhook,
    handleSave
  } = useSettings();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-fade-in">
      <form onSubmit={handleSave}>
        
        {/* API Credentials */}
        <Card className="settings-section">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} /> Credenciais e Chaves de API
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Configure suas chaves de API para utilizar inteligência artificial real e buscas automáticas no Google Maps. Se deixadas vazias, o sistema usará motores de simulação inteligentes integrados.
          </p>

          <div className="settings-row">
            <Input 
              type="password"
              label="Gemini API Key"
              placeholder="AIzaSy..."
              value={settings.gemini_api_key}
              onChange={(e) => handleChange('gemini_api_key', e.target.value)}
            />
            <Input 
              type="password"
              label="OpenAI API Key"
              placeholder="sk-..."
              value={settings.openai_api_key}
              onChange={(e) => handleChange('openai_api_key', e.target.value)}
            />
          </div>

          <div className="settings-row">
            <Input 
              type="password"
              label="Claude (Anthropic) API Key"
              placeholder="sk-ant-..."
              value={settings.claude_api_key}
              onChange={(e) => handleChange('claude_api_key', e.target.value)}
            />
            <Input 
              type="password"
              label="Google Places API Key"
              placeholder="Chave de busca do Google Maps..."
              value={settings.google_places_api_key}
              onChange={(e) => handleChange('google_places_api_key', e.target.value)}
            />
          </div>
        </Card>

        {/* Prospecting Rules */}
        <Card className="settings-section">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} /> Templates de Prospecção & Automação
          </h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
            <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span>Use os marcadores <strong>[Nome]</strong> (nome do lead) e <strong>[Empresa]</strong> (nome da empresa) nos templates. Eles serão substituídos dinamicamente!</span>
          </div>

          <Input 
            textarea
            label="Mensagem de Cobrança 1 (D+2 dias)"
            value={settings.follow_up_day_2}
            onChange={(e) => handleChange('follow_up_day_2', e.target.value)}
            style={{ height: '90px', marginBottom: '16px' }}
          />

          <Input 
            textarea
            label="Mensagem de Cobrança 2 (D+5 dias)"
            value={settings.follow_up_day_5}
            onChange={(e) => handleChange('follow_up_day_5', e.target.value)}
            style={{ height: '90px', marginBottom: '16px' }}
          />

          <Input 
            textarea
            label="Mensagem de Cobrança 3 (D+10 dias)"
            value={settings.follow_up_day_10}
            onChange={(e) => handleChange('follow_up_day_10', e.target.value)}
            style={{ height: '90px', marginBottom: '20px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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
        </Card>

        {/* Webhooks / Integrations */}
        <Card className="settings-section">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} /> Integrações Externas & Webhooks de Automação
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Integre o AgenticLeads 2.0 com plataformas de automação (Make.com, Zapier, n8n) enviando payloads JSON contendo dados reais dos leads nos eventos-chave.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label className="input-label">Ao Capturar Novo Lead (NEW_LEAD)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="https://hook.us1.make.com/..."
                  className="input-field"
                  style={{ flex: 1 }}
                  value={settings.webhook_url_new_lead || ''}
                  onChange={(e) => handleChange('webhook_url_new_lead', e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTestWebhook('NEW_LEAD', settings.webhook_url_new_lead)}
                >
                  Testar
                </Button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Ao Mudar Status do Lead (STATUS_CHANGED)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="https://hook.us1.make.com/..."
                  className="input-field"
                  style={{ flex: 1 }}
                  value={settings.webhook_url_status_changed || ''}
                  onChange={(e) => handleChange('webhook_url_status_changed', e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTestWebhook('STATUS_CHANGED', settings.webhook_url_status_changed)}
                >
                  Testar
                </Button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label className="input-label">Ao Enviar Mensagem (MESSAGE_SENT)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="https://hook.us1.make.com/..."
                  className="input-field"
                  style={{ flex: 1 }}
                  value={settings.webhook_url_message_sent || ''}
                  onChange={(e) => handleChange('webhook_url_message_sent', e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTestWebhook('MESSAGE_SENT', settings.webhook_url_message_sent)}
                >
                  Testar
                </Button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Ao Enviar Proposta (PROPOSAL_SENT)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="https://hook.us1.make.com/..."
                  className="input-field"
                  style={{ flex: 1 }}
                  value={settings.webhook_url_proposal_sent || ''}
                  onChange={(e) => handleChange('webhook_url_proposal_sent', e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTestWebhook('PROPOSAL_SENT', settings.webhook_url_proposal_sent)}
                >
                  Testar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
          {successMsg && (
            <span style={{ color: 'var(--color-success)', fontWeight: '600', fontSize: '0.85rem' }}>
              {successMsg}
            </span>
          )}
          <Button variant="save" type="submit" loading={saving}>
            Salvar Todas as Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
