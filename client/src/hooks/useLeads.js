import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { leadService } from '../services/api';

export default function useLeads(filters = {}, refreshTrigger = 0) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  const [segments, setSegments] = useState([]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadService.getLeads(filtersRef.current);
      setLeads(data);
      
      // Extract unique cities and segments for filters if not set yet
      const uniqueCities = [...new Set(data.map(l => l.city))].filter(Boolean);
      const uniqueSegments = [...new Set(data.map(l => l.segment))].filter(Boolean);
      
      setCities(uniqueCities);
      setSegments(uniqueSegments);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError(err.message || 'Falha ao buscar leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, filtersKey, refreshTrigger]);

  const updateLeadStatus = async (leadId, targetStatus) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id.toString() === leadId.toString() ? { ...l, status: targetStatus } : l));
    
    try {
      await leadService.updateStatus(leadId, targetStatus);
    } catch (err) {
      console.error('Falha ao atualizar status do lead:', err);
      alert('Falha ao atualizar o status do lead no servidor. Operação revertida.');
      // Rollback
      fetchLeads();
      throw err;
    }
  };

  const deleteLead = async (leadId) => {
    if (!confirm('Tem certeza que deseja deletar este lead permanentemente?')) return false;
    try {
      await leadService.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id.toString() !== leadId.toString()));
      return true;
    } catch (err) {
      console.error('Erro ao deletar lead:', err);
      alert('Não foi possível deletar o lead.');
      return false;
    }
  };

  return {
    leads,
    loading,
    error,
    cities,
    segments,
    refetch: fetchLeads,
    updateLeadStatus,
    deleteLead,
    setLeads
  };
}
