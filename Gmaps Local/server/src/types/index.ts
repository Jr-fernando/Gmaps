// Shared types for the application

export interface CompanyData {
  placeId: string;
  name: string;
  category?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  googleMapsUrl?: string | null;
  searchQuery?: string | null;
}

export interface AnalysisResult {
  score: number;
  summary: string;
  problems: string[];
  opportunities: string[];
  recommendedServices: string[];
  priority: 'alta' | 'media' | 'baixa';
  prospectMessage: string;
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

export interface SearchParams {
  city: string;
  segment: string;
  radius: number;
}

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
