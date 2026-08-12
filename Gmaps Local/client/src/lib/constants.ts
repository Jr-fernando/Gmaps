export const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-red-500/15 text-red-400 border-red-500/20',
  media: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  baixa: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

export const PRIORITY_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return formatDateShort(dateStr);
}

export function formatWhatsAppLink(whatsapp: string | null): string | null {
  if (!whatsapp) return null;
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 25) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-500/15';
  if (score >= 50) return 'bg-yellow-500/15';
  if (score >= 25) return 'bg-orange-500/15';
  return 'bg-red-500/15';
}

export function parseJsonField(value: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
