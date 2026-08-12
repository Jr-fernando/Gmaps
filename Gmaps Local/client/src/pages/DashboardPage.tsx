import { useQuery } from '@tanstack/react-query';
import { Building2, Search, Brain, Users, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/constants';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: api.getStats,
    refetchInterval: 30000,
  });

  const { data: searchHistory } = useQuery({
    queryKey: ['search-history'],
    queryFn: api.getSearchHistory,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" description="Visão geral do AgenticLeads" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Visão geral do AgenticLeads" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Empresas"
          value={stats?.totalCompanies ?? 0}
          icon={<Building2 className="h-5 w-5" />}
          description="Empresas no banco"
        />
        <StatCard
          title="Encontradas Hoje"
          value={stats?.foundToday ?? 0}
          icon={<Search className="h-5 w-5" />}
          description="Novas hoje"
        />
        <StatCard
          title="Analisadas"
          value={stats?.analyzed ?? 0}
          icon={<Brain className="h-5 w-5" />}
          description="Análise com IA"
        />
        <StatCard
          title="No CRM"
          value={stats?.inCrm ?? 0}
          icon={<Users className="h-5 w-5" />}
          description="Leads ativos"
        />
      </div>

      {/* Last Search */}
      {stats?.lastSearch && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Última Pesquisa
          </div>
          <div className="mt-3 flex items-center gap-6 text-sm text-muted-foreground">
            <span>
              <span className="text-foreground font-medium">{stats.lastSearch.segment}</span> em{' '}
              <span className="text-foreground font-medium">{stats.lastSearch.city}</span>
            </span>
            <span>{stats.lastSearch.resultsCount} resultados</span>
            <span>{formatRelativeTime(stats.lastSearch.createdAt)}</span>
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {searchHistory && searchHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Pesquisas Recentes</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Pesquisa</th>
                  <th className="px-5 py-3 font-medium">Cidade</th>
                  <th className="px-5 py-3 font-medium">Raio</th>
                  <th className="px-5 py-3 font-medium">Resultados</th>
                  <th className="px-5 py-3 font-medium">Quando</th>
                </tr>
              </thead>
              <tbody>
                {searchHistory.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium text-foreground">{log.segment}</td>
                    <td className="px-5 py-3 text-muted-foreground">{log.city}</td>
                    <td className="px-5 py-3 text-muted-foreground">{log.radius}km</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {log.resultsCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatRelativeTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!stats || stats.totalCompanies === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-sm font-medium text-foreground">Nenhuma empresa encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece pesquisando empresas na aba Pesquisa
          </p>
        </div>
      )}
    </div>
  );
}
