import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, MapPin, Star, MessageSquarePlus, Send, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { CRM_STATUS_LABELS, CRM_STATUS_COLORS } from '@/types';
import type { CrmStatus, CrmEntry, CrmNote } from '@/types';
import { formatRelativeTime } from '@/lib/constants';

const STATUS_ORDER: CrmStatus[] = [
  'novo_lead',
  'contato_feito',
  'respondeu',
  'negociacao',
  'cliente',
  'perdido',
];

export function CrmPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notesModal, setNotesModal] = useState<CrmEntry | null>(null);
  const [newNote, setNewNote] = useState('');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: api.getLeads,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ crmEntryId, content }: { crmEntryId: string; content: string }) =>
      api.addNote(crmEntryId, content),
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      if (notesModal) {
        queryClient.invalidateQueries({ queryKey: ['crm-notes', notesModal.id] });
      }
    },
  });

  const { data: modalNotes } = useQuery({
    queryKey: ['crm-notes', notesModal?.id],
    queryFn: () => api.getNotes(notesModal!.id),
    enabled: !!notesModal,
  });

  // Group leads by status
  const grouped = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = leads?.filter((l) => l.status === status) || [];
      return acc;
    },
    {} as Record<CrmStatus, CrmEntry[]>,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM" description="Gerencie seus leads" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="h-48 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description={`${leads?.length ?? 0} leads no pipeline`}
      />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex flex-col rounded-xl border border-border bg-card/50">
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${CRM_STATUS_COLORS[status]} text-[10px]`}
                >
                  {CRM_STATUS_LABELS[status]}
                </Badge>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {grouped[status].length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 p-2 min-h-[120px]">
              {grouped[status].map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/30"
                >
                  <button
                    onClick={() => navigate(`/companies/${lead.company.id}`)}
                    className="block w-full text-left"
                  >
                    <h4 className="truncate text-xs font-medium text-foreground">
                      {lead.company.name}
                    </h4>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {lead.company.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {lead.company.city}
                        </span>
                      )}
                      {lead.company.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                          {lead.company.rating}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="mt-2 flex items-center gap-1">
                    <Select
                      value={lead.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({ id: lead.id, status: value })
                      }
                    >
                      <SelectTrigger className="h-6 text-[10px] flex-1 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_ORDER.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {CRM_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setNotesModal(lead)}
                    >
                      <MessageSquarePlus className="h-3 w-3" />
                    </Button>

                    {lead.company.phone && (
                      <a href={`tel:${lead.company.phone}`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Phone className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Last note preview */}
                  {lead.notes.length > 0 && (
                    <p className="mt-2 truncate text-[10px] text-muted-foreground italic">
                      "{lead.notes[0].content}"
                    </p>
                  )}
                </div>
              ))}

              {grouped[status].length === 0 && (
                <div className="flex items-center justify-center py-6">
                  <p className="text-[10px] text-muted-foreground/50">Vazio</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notes Modal */}
      <Dialog open={!!notesModal} onOpenChange={() => setNotesModal(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-sm">Observações — {notesModal?.company.name}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Add Note */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Nova observação..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="bg-background text-sm min-h-[60px]"
            />
            <Button
              size="sm"
              disabled={!newNote.trim() || addNoteMutation.isPending}
              onClick={() => {
                if (notesModal && newNote.trim()) {
                  addNoteMutation.mutate({ crmEntryId: notesModal.id, content: newNote.trim() });
                }
              }}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Notes List */}
          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {modalNotes?.map((note: CrmNote) => (
              <div key={note.id} className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatRelativeTime(note.createdAt)}
                </p>
              </div>
            ))}
            {(!modalNotes || modalNotes.length === 0) && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Nenhuma observação ainda
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
