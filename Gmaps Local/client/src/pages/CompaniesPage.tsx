import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Brain, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { CRM_STATUS_LABELS, CRM_STATUS_COLORS } from '@/types';
import type { CrmStatus } from '@/types';

export function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search, page],
    queryFn: () => api.getCompanies({ search: search || undefined, page, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description={`${data?.total ?? 0} empresas encontradas`}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, categoria ou cidade..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-card pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : data?.companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-sm font-medium text-foreground">Nenhuma empresa encontrada</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.companies.map((company) => (
            <button
              key={company.id}
              onClick={() => navigate(`/companies/${company.id}`)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-card/80"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {company.name}
                    </h3>
                    {company.analysis?.score != null && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Brain className="h-3 w-3" />
                        {company.analysis.score}
                      </span>
                    )}
                    {company.crmEntry && (
                      <Badge variant="outline" className={CRM_STATUS_COLORS[company.crmEntry.status as CrmStatus]}>
                        <Users className="mr-1 h-3 w-3" />
                        {CRM_STATUS_LABELS[company.crmEntry.status as CrmStatus]}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    {company.category && <span>{company.category}</span>}
                    {company.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {company.city}
                      </span>
                    )}
                    {company.phone && <span>{company.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {company.rating && (
                    <span className="flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">
                      <Star className="h-3 w-3 fill-yellow-400" />
                      {company.rating}
                      {company.totalReviews != null && (
                        <span className="text-yellow-400/60">({company.totalReviews})</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {data.page} de {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
