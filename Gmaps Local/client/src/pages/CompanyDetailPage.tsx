import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Phone, Globe, MapPin, Star, ExternalLink, MessageCircle,
  Brain, Loader2, Users, Instagram, Copy, Check,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  formatDate, formatWhatsAppLink, getScoreColor, getScoreBg,
  PRIORITY_COLORS, PRIORITY_LABELS, parseJsonField,
} from '@/lib/constants';
import { CRM_STATUS_LABELS, CRM_STATUS_COLORS } from '@/types';
import type { CrmStatus } from '@/types';

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => api.getCompany(id!),
    enabled: !!id,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeCompany(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
  });

  const addToCrmMutation = useMutation({
    mutationFn: () => api.addToCrm(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Empresa não encontrada</p>
      </div>
    );
  }

  const analysis = company.analysis;
  const problems = analysis ? parseJsonField(analysis.problems) : [];
  const opportunities = analysis ? parseJsonField(analysis.opportunities) : [];
  const recommendedServices = analysis ? parseJsonField(analysis.recommendedServices) : [];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <PageHeader title={company.name} description={company.category || undefined}>
          {!company.crmEntry && (
            <Button
              variant="outline"
              onClick={() => addToCrmMutation.mutate()}
              disabled={addToCrmMutation.isPending}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Adicionar ao CRM
            </Button>
          )}
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="gap-2"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {analysis ? 'Re-analisar' : 'Analisar com IA'}
          </Button>
        </PageHeader>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2">
        {company.rating && (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <Star className="mr-1 h-3 w-3 fill-yellow-400" />
            {company.rating} ({company.totalReviews ?? 0} avaliações)
          </Badge>
        )}
        {company.crmEntry && (
          <Badge variant="outline" className={CRM_STATUS_COLORS[company.crmEntry.status as CrmStatus]}>
            {CRM_STATUS_LABELS[company.crmEntry.status as CrmStatus]}
          </Badge>
        )}
        {analysis?.priority && (
          <Badge variant="outline" className={PRIORITY_COLORS[analysis.priority]}>
            Prioridade {PRIORITY_LABELS[analysis.priority]}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Company Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Informações</h2>

            {company.phone && (
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={company.phone}
                copyable onCopy={() => copyToClipboard(company.phone!, 'phone')} copied={copiedField === 'phone'} />
            )}
            {company.whatsapp && (
              <InfoRow icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={company.whatsapp}
                link={formatWhatsAppLink(company.whatsapp) || undefined} />
            )}
            {company.website && (
              <InfoRow icon={<Globe className="h-4 w-4" />} label="Website"
                value={company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                link={company.website} />
            )}
            {company.instagram && (
              <InfoRow icon={<Instagram className="h-4 w-4" />} label="Instagram" value={company.instagram}
                link={`https://instagram.com/${company.instagram.replace('@', '')}`} />
            )}
            {company.address && (
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Endereço" value={company.address} />
            )}
            {company.googleMapsUrl && (
              <a
                href={company.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Ver no Google Maps
              </a>
            )}

            <Separator />
            <p className="text-xs text-muted-foreground">
              Adicionada em {formatDate(company.createdAt)}
            </p>
          </div>
        </div>

        {/* Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {analyzeMutation.isPending && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Analisando com IA...</p>
                <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
              </div>
            </div>
          )}

          {analyzeMutation.isError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {analyzeMutation.error.message}
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Score */}
              {analysis.score != null && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${getScoreBg(analysis.score)}`}>
                      <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                        {analysis.score}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Score de Oportunidade</h3>
                      <p className="text-xs text-muted-foreground">
                        Baseado nos dados disponíveis da empresa
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {analysis.summary && (
                <AnalysisSection title="Resumo" content={analysis.summary} />
              )}

              {/* Problems */}
              {problems.length > 0 && (
                <AnalysisListSection title="Problemas Encontrados" items={problems} color="text-red-400" dotColor="bg-red-400" />
              )}

              {/* Opportunities */}
              {opportunities.length > 0 && (
                <AnalysisListSection title="Oportunidades" items={opportunities} color="text-emerald-400" dotColor="bg-emerald-400" />
              )}

              {/* Recommended Services */}
              {recommendedServices.length > 0 && (
                <AnalysisListSection title="Serviços Recomendados" items={recommendedServices} color="text-primary" dotColor="bg-primary" />
              )}

              {/* Prospect Message */}
              {analysis.prospectMessage && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Mensagem de Prospecção
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(analysis.prospectMessage!, 'message')}
                      className="gap-1 text-xs"
                    >
                      {copiedField === 'message' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedField === 'message' ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {analysis.prospectMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {!analysis && !analyzeMutation.isPending && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <Brain className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-medium text-foreground">Nenhuma análise ainda</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Clique em "Analisar com IA" para gerar insights
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components

function InfoRow({ icon, label, value, link, copyable, onCopy, copied }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  link?: string;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm text-primary hover:underline block"
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-sm text-foreground">{value}</p>
        )}
      </div>
      {copyable && onCopy && (
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function AnalysisSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground">{content}</p>
    </div>
  );
}

function AnalysisListSection({ title, items, color, dotColor }: {
  title: string;
  items: string[];
  color: string;
  dotColor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${color}`}>
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
