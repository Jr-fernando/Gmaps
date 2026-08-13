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
  return fetch(url, { ...options, credentials: 'same-origin' });
};

export const authService = {
  session: async () => handleResponse(await fetch('/api/auth/session')),
  login: async (password) => handleResponse(await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })),
  logout: async () => fetch('/api/auth/logout', { method: 'POST' })
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

  searchLeads: async (criteria, legacyCity) => {
    const payload = typeof criteria === 'string' ? { query: criteria, city: legacyCity } : criteria;
    const res = await apiFetch('/api/leads/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
  },

  prioritize: async (leadIds, objective = '') => {
    const res = await apiFetch('/api/leads/ai-prioritize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, objective })
    });
    return handleResponse(res);
  },

  setArchived: async (leadIds, archived = true) => handleResponse(await apiFetch('/api/leads/archive', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadIds, archived })
  })),

  exportContacts: async (leadIds, format) => {
    const response = await apiFetch('/api/leads/export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadIds, format })
    });
    if (!response.ok) return handleResponse(response);
    const disposition = response.headers.get('content-disposition') || '';
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `leadmap-contatos.${format}`;
    return { blob: await response.blob(), filename, exported: Number(response.headers.get('x-exported-count')) || 0 };
  }
};

export const folderService = {
  getAll: async () => handleResponse(await apiFetch('/api/folders')),
  create: async (name) => handleResponse(await apiFetch('/api/folders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
  })),
  rename: async (id, name) => handleResponse(await apiFetch(`/api/folders/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
  })),
  remove: async (id) => handleResponse(await apiFetch(`/api/folders/${id}`, { method: 'DELETE' })),
  addLeads: async (id, leadIds) => handleResponse(await apiFetch(`/api/folders/${id}/leads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadIds })
  })),
  removeLeads: async (id, leadIds) => handleResponse(await apiFetch(`/api/folders/${id}/leads`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadIds })
  }))
};

export const searchService = {
  getSaved: async () => handleResponse(await apiFetch('/api/searches')),
  getById: async (id) => handleResponse(await apiFetch(`/api/searches/${id}`)),
  recommend: async (current = {}) => handleResponse(await apiFetch('/api/searches/ai-recommend', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current })
  }))
};

export const outreachService = {
  getConnections: async () => handleResponse(await apiFetch('/api/outreach/connections')),
  getMessages: async (status = '') => handleResponse(await apiFetch(`/api/outreach/messages${status ? `?status=${encodeURIComponent(status)}` : ''}`)),
  createPlan: async (leadIds, objective = '') => handleResponse(await apiFetch('/api/outreach/plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadIds, objective })
  })),
  updateMessage: async (id, changes) => handleResponse(await apiFetch(`/api/outreach/messages/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes)
  })),
  sendMessage: async (id) => handleResponse(await apiFetch(`/api/outreach/messages/${id}/send`, { method: 'POST' })),
  handoff: async (id) => handleResponse(await apiFetch(`/api/outreach/messages/${id}/handoff`, { method: 'POST' }))
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
