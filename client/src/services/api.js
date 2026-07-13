const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMsg = `Erro na requisição: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      // Ignorar falha ao parsear erro como JSON
    }
    throw new Error(errorMsg);
  }
  return response.json();
};

const apiFetch = (url, options = {}) => {
  const token = import.meta.env.VITE_API_TOKEN;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};

export const dashboardService = {
  getStats: async () => {
    const res = await apiFetch('/api/dashboard/stats');
    return handleResponse(res);
  }
};

export const leadService = {
  getLeads: async (filters = {}) => {
    let url = '/api/leads?';
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url += `${key}=${encodeURIComponent(val)}&`;
      }
    });
    const res = await apiFetch(url);
    return handleResponse(res);
  },

  getLeadById: async (id) => {
    const res = await apiFetch(`/api/leads/${id}`);
    return handleResponse(res);
  },

  searchLeads: async (query, city) => {
    const res = await apiFetch('/api/leads/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, city })
    });
    return handleResponse(res);
  },

  updateStatus: async (id, status) => {
    const res = await apiFetch(`/api/leads/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  deleteLead: async (id) => {
    const res = await apiFetch(`/api/leads/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  updateCrm: async (id, crmData) => {
    const res = await apiFetch(`/api/leads/${id}/crm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crmData)
    });
    return handleResponse(res);
  },

  sendMessage: async (id, message, channel) => {
    const res = await apiFetch(`/api/leads/${id}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, channel })
    });
    return handleResponse(res);
  },

  regenerateReport: async (id) => {
    const res = await apiFetch(`/api/leads/${id}/generate-message`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  generateProposal: async (id, services) => {
    const res = await apiFetch(`/api/leads/${id}/proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services })
    });
    return handleResponse(res);
  },

  sendChat: async (id, message, history) => {
    const res = await apiFetch(`/api/leads/${id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    return handleResponse(res);
  }
};

export const settingsService = {
  getSettings: async () => {
    const res = await apiFetch('/api/settings');
    return handleResponse(res);
  },

  saveSettings: async (settings) => {
    const res = await apiFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },

  testWebhook: async (event, url) => {
    const res = await apiFetch('/api/settings/test-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, url })
    });
    return handleResponse(res);
  }
};

export const automationService = {
  triggerAutomation: async () => {
    const res = await apiFetch('/api/automation/trigger', {
      method: 'POST'
    });
    return handleResponse(res);
  }
};

export { apiFetch };
