// Shared types for the frontend

export interface Company {
  id: string;
  placeId: string;
  name: string;
  category: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  totalReviews: number | null;
  googleMapsUrl: string | null;
  searchQuery: string | null;
  createdAt: string;
  updatedAt: string;
  analysis?: { score: number | null; priority: string | null } | null;
  crmEntry?: { status: string } | null;
}

export interface CompanyDetail extends Company {
  analysis: Analysis | null;
  crmEntry: CrmEntryDetail | null;
}

export interface Analysis {
  id: string;
  companyId: string;
  score: number | null;
  summary: string | null;
  problems: string[] | string | null;
  opportunities: string[] | string | null;
  recommendedServices: string[] | string | null;
  priority: string | null;
  prospectMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmEntry {
  id: string;
  companyId: string;
  status: CrmStatus;
  company: {
    id: string;
    name: string;
    category: string | null;
    city: string | null;
    phone: string | null;
    whatsapp: string | null;
    rating: number | null;
  };
  notes: CrmNote[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmEntryDetail {
  id: string;
  companyId: string;
  status: CrmStatus;
  notes: CrmNote[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmNote {
  id: string;
  crmEntryId: string;
  content: string;
  createdAt: string;
}

export type CrmStatus =
  | 'novo_lead'
  | 'contato_feito'
  | 'respondeu'
  | 'negociacao'
  | 'cliente'
  | 'perdido';

export const CRM_STATUS_LABELS: Record<CrmStatus, string> = {
  novo_lead: 'Novo Lead',
  contato_feito: 'Contato Feito',
  respondeu: 'Respondeu',
  negociacao: 'Negociação',
  cliente: 'Cliente',
  perdido: 'Perdido',
};

export const CRM_STATUS_COLORS: Record<CrmStatus, string> = {
  novo_lead: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  contato_feito: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  respondeu: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  negociacao: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  cliente: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  perdido: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export interface DashboardStats {
  totalCompanies: number;
  foundToday: number;
  analyzed: number;
  inCrm: number;
  lastSearch: {
    query: string;
    city: string;
    segment: string;
    resultsCount: number;
    createdAt: string;
  } | null;
}

export interface SearchParams {
  city: string;
  segment: string;
  radius: number;
}

export interface SearchResult {
  message: string;
  total: number;
  created: number;
  skipped: number;
  companies: Company[];
}

export interface SearchLog {
  id: string;
  query: string;
  city: string;
  segment: string;
  radius: number;
  resultsCount: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  companies: T[];
  total: number;
  page: number;
  totalPages: number;
}
