import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Tag, Radius, Loader2, CheckCircle2, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import type { SearchResult, Company } from '@/types';

const searchSchema = z.object({
  city: z.string().min(2, 'Mínimo 2 caracteres'),
  segment: z.string().min(2, 'Mínimo 2 caracteres'),
  radius: z.coerce.number().min(1, 'Mínimo 1km').max(50, 'Máximo 50km'),
});

type SearchFormData = z.infer<typeof searchSchema>;

export function SearchPage() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { city: '', segment: '', radius: 10 },
  });

  const searchMutation = useMutation({
    mutationFn: api.search,
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const onSubmit = (data: SearchFormData) => {
    setResult(null);
    searchMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pesquisa"
        description="Encontre empresas via Google Places"
      />

      {/* Search Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Cidade
            </Label>
            <Input
              id="city"
              placeholder="Ex: São Paulo"
              {...register('city')}
              className="bg-background"
            />
            {errors.city && (
              <p className="text-xs text-red-400">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Segmento
            </Label>
            <Input
              id="segment"
              placeholder="Ex: Restaurantes"
              {...register('segment')}
              className="bg-background"
            />
            {errors.segment && (
              <p className="text-xs text-red-400">{errors.segment.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="radius" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Radius className="h-3.5 w-3.5" />
              Raio (km)
            </Label>
            <Input
              id="radius"
              type="number"
              min={1}
              max={50}
              {...register('radius')}
              className="bg-background"
            />
            {errors.radius && (
              <p className="text-xs text-red-400">{errors.radius.message}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button
            type="submit"
            disabled={searchMutation.isPending}
            className="gap-2"
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {searchMutation.isPending ? 'Pesquisando...' : 'Pesquisar'}
          </Button>

          {searchMutation.isPending && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Consultando Google Places API...
            </p>
          )}
        </div>

        {searchMutation.isError && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {searchMutation.error.message}
          </div>
        )}
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-emerald-300">{result.message}</p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.companies.map((company: Company) => (
              <div
                key={company.placeId}
                className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {company.name}
                    </h3>
                    {company.category && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{company.category}</p>
                    )}
                  </div>
                  {company.rating && (
                    <span className="ml-2 flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                      ★ {company.rating}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  {company.city && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {company.city}
                    </p>
                  )}
                  {company.phone && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {company.phone}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
