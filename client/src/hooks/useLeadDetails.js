import { useState, useEffect, useCallback } from 'react';
import { leadService } from '../services/api';

export default function useLeadDetails(leadId, onLeadUpdated) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCrm, setSavingCrm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  // CRM Editable States
  const [crmOwner, setCrmOwner] = useState('');
  const [crmValue, setCrmValue] = useState('');
  const [crmNextAction, setCrmNextAction] = useState('');
  const [crmNotes, setCrmNotes] = useState('');
  const [crmStatus, setCrmStatus] = useState('Novo Lead');
  const [crmFirstContactDate, setCrmFirstContactDate] = useState('');
  const [crmLastContactDate, setCrmLastContactDate] = useState('');
  const [crmHistory, setCrmHistory] = useState([]);
  const [crmProposalSent, setCrmProposalSent] = useState(false);
  const [crmProposalText, setCrmProposalText] = useState('');
  const [crmLabels, setCrmLabels] = useState([]);
  const [crmProbability, setCrmProbability] = useState(50);
  const [crmNextContactDate, setCrmNextContactDate] = useState('');

  const fetchLeadDetails = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const data = await leadService.getLeadById(leadId);
      setLead(data);
      setCrmOwner(data.owner || '');
      setCrmValue(data.value_negotiated || '');
      setCrmNextAction(data.next_action || '');
      setCrmNotes(data.notes || '');
      setCrmStatus(data.status || 'Novo Lead');
      setCrmFirstContactDate(data.first_contact_date || '');
      setCrmLastContactDate(data.last_contact_date || '');
      setCrmHistory(data.history || []);
      setCrmProposalSent(data.proposal_sent === 1 || data.proposal_sent === true);
      setCrmProposalText(data.proposal_text || '');
      
      let parsedLabels = [];
      try {
        parsedLabels = typeof data.labels === 'string' ? JSON.parse(data.labels) : data.labels || [];
      } catch (err) {
        console.warn('Erro ao parsear labels:', err);
        parsedLabels = [];
      }
      setCrmLabels(parsedLabels);
      setCrmProbability(data.probability !== undefined ? data.probability : 50);
      setCrmNextContactDate(data.next_contact_date || '');
    } catch (err) {
      console.error('Erro ao buscar detalhes do lead:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  const saveCrm = async (crmDataOverrides = {}) => {
    setSavingCrm(true);
    setSaveSuccess(false);
    
    const payload = {
      owner: crmOwner,
      value_negotiated: parseFloat(crmValue || 0),
      next_action: crmNextAction,
      notes: crmNotes,
      status: crmStatus,
      first_contact_date: crmFirstContactDate,
      last_contact_date: crmLastContactDate,
      history: crmHistory,
      proposal_text: crmProposalText,
      proposal_sent: crmProposalSent,
      labels: crmLabels,
      probability: crmProbability,
      next_contact_date: crmNextContactDate,
      ...crmDataOverrides
    };

    try {
      const res = await leadService.updateCrm(leadId, payload);
      if (res.success) {
        setSaveSuccess(true);
        setLead(prev => ({ ...prev, ...payload }));
        if (onLeadUpdated) onLeadUpdated();
        setTimeout(() => setSaveSuccess(false), 3000);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao salvar CRM:', err);
      alert('Erro ao salvar dados do CRM.');
      return false;
    } finally {
      setSavingCrm(false);
    }
  };

  const addHistoryLog = async (noteText) => {
    if (!noteText.trim()) return false;
    const now = new Date().toISOString();
    const newEvent = {
      date: now,
      type: 'manual_note',
      description: noteText.trim()
    };
    
    const updatedHistory = [...crmHistory, newEvent];
    const firstContact = crmFirstContactDate || now;
    
    setCrmHistory(updatedHistory);
    setCrmLastContactDate(now);
    if (!crmFirstContactDate) setCrmFirstContactDate(now);

    const payload = {
      owner: crmOwner,
      value_negotiated: parseFloat(crmValue || 0),
      next_action: crmNextAction,
      notes: crmNotes,
      status: crmStatus,
      first_contact_date: firstContact,
      last_contact_date: now,
      history: updatedHistory,
      proposal_text: crmProposalText,
      proposal_sent: crmProposalSent,
      labels: crmLabels,
      probability: crmProbability,
      next_contact_date: crmNextContactDate
    };

    try {
      const res = await leadService.updateCrm(leadId, payload);
      if (res.success) {
        setLead(prev => ({ 
          ...prev, 
          history: updatedHistory,
          last_contact_date: now,
          first_contact_date: firstContact
        }));
        if (onLeadUpdated) onLeadUpdated();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao adicionar nota ao histórico:', err);
      alert('Não foi possível salvar a nota de histórico.');
      return false;
    }
  };

  const sendMessage = async (channel, message) => {
    try {
      await leadService.sendMessage(leadId, message, channel);
      // Recarregar os detalhes para atualizar o histórico
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
      return true;
    } catch (err) {
      console.error('Erro ao disparar mensagem:', err);
      alert('Não foi possível registrar o envio da mensagem.');
      return false;
    }
  };

  const regenerateReport = async () => {
    setRegenerating(true);
    try {
      await leadService.regenerateReport(leadId);
      await fetchLeadDetails();
      return true;
    } catch (err) {
      console.error('Erro ao regenerar diagnóstico:', err);
      alert('Falha ao rodar reanálise por IA.');
      return false;
    } finally {
      setRegenerating(false);
    }
  };

  const generateProposal = async (services) => {
    setGeneratingProposal(true);
    try {
      const data = await leadService.generateProposal(leadId, services);
      setProposalTextState(data.proposal);
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
      return data.proposal;
    } catch (err) {
      console.error('Erro ao gerar proposta:', err);
      alert('Falha ao gerar a proposta comercial.');
      return null;
    } finally {
      setGeneratingProposal(false);
    }
  };

  const setProposalTextState = (text) => {
    setCrmProposalText(text);
    setCrmProposalSent(true);
  };

  return {
    lead,
    loading,
    savingCrm,
    saveSuccess,
    regenerating,
    generatingProposal,
    
    // CRM States
    crmOwner, setCrmOwner,
    crmValue, setCrmValue,
    crmNextAction, setCrmNextAction,
    crmNotes, setCrmNotes,
    crmStatus, setCrmStatus,
    crmFirstContactDate, setCrmFirstContactDate,
    crmLastContactDate, setCrmLastContactDate,
    crmHistory, setCrmHistory,
    crmProposalSent, setCrmProposalSent,
    crmProposalText, setCrmProposalText,
    crmLabels, setCrmLabels,
    crmProbability, setCrmProbability,
    crmNextContactDate, setCrmNextContactDate,
    
    // Operations
    refetch: fetchLeadDetails,
    saveCrm,
    addHistoryLog,
    sendMessage,
    regenerateReport,
    generateProposal
  };
}
