import { useState, useEffect } from 'react';
import { settingsService } from '../services/api';

export default function useSettings() {
  const [settings, setSettings] = useState({
    places_api_key: '',
    openai_api_key: '',
    supabase_url: '',
    supabase_key: '',
    webhook_whatsapp: '',
    webhook_email: '',
    whatsapp_active: false,
    email_active: false,
    simulation_mode: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await settingsService.getSettings();
        setSettings(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTestWebhook = async (event, url) => {
    if (!url) {
      alert('Por favor, insira a URL antes de realizar o teste.');
      return;
    }
    try {
      const data = await settingsService.testWebhook(event, url);
      if (data.success) {
        alert(`✓ Webhook enviado com sucesso! Evento: ${event}`);
      } else {
        alert(`❌ Falha no webhook: ${data.error}`);
      }
    } catch(err) {
      alert(`❌ Erro ao disparar webhook: ${err.message}`);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const payload = Object.fromEntries(
        Object.entries(settings).filter(([key, value]) => !key.endsWith('_api_key') || String(value || '').trim())
      );
      const data = await settingsService.saveSettings(payload);
      if (data.success) {
        setSuccessMsg('Configurações salvas com sucesso!');
        setTimeout(() => setSuccessMsg(''), 4000);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      alert('Erro ao salvar as configurações.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    successMsg,
    handleChange,
    handleTestWebhook,
    handleSave,
    setSettings
  };
}
