const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getStats: () => request<import('../types').DashboardStats>('/dashboard/stats'),

  // Search
  search: (params: import('../types').SearchParams) =>
    request<import('../types').SearchResult>('/search', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getSearchHistory: () => request<import('../types').SearchLog[]>('/search/history'),

  // Companies
  getCompanies: (params?: {
    search?: string;
    city?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.city) searchParams.set('city', params.city);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request<import('../types').PaginatedResponse<import('../types').Company>>(
      `/companies${qs ? `?${qs}` : ''}`,
    );
  },
  getCompany: (id: string) => request<import('../types').CompanyDetail>(`/companies/${id}`),
  deleteCompany: (id: string) => request<{ message: string }>(`/companies/${id}`, { method: 'DELETE' }),

  // Analysis
  analyzeCompany: (companyId: string) =>
    request<import('../types').Analysis>(`/analysis/${companyId}`, { method: 'POST' }),
  getAnalysis: (companyId: string) =>
    request<import('../types').Analysis>(`/analysis/${companyId}`),

  // CRM
  getLeads: () => request<import('../types').CrmEntry[]>('/crm'),
  addToCrm: (companyId: string) =>
    request<import('../types').CrmEntry>(`/crm/${companyId}`, { method: 'POST' }),
  updateLeadStatus: (id: string, status: string) =>
    request<import('../types').CrmEntry>(`/crm/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  addNote: (crmEntryId: string, content: string) =>
    request<import('../types').CrmNote>(`/crm/${crmEntryId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getNotes: (crmEntryId: string) =>
    request<import('../types').CrmNote[]>(`/crm/${crmEntryId}/notes`),
  removeFromCrm: (id: string) =>
    request<{ message: string }>(`/crm/${id}`, { method: 'DELETE' }),
};
