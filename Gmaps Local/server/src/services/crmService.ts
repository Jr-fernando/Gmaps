import prisma from '../lib/prisma.js';
import type { CrmStatus } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Add a company to the CRM
 */
export async function addToCrm(companyId: string) {
  // Check if company exists
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError(404, 'Empresa não encontrada');
  }

  // Check if already in CRM
  const existing = await prisma.crmEntry.findUnique({ where: { companyId } });
  if (existing) {
    throw new AppError(409, 'Empresa já está no CRM');
  }

  return prisma.crmEntry.create({
    data: { companyId, status: 'novo_lead' },
    include: {
      company: { select: { name: true, category: true, city: true, rating: true } },
    },
  });
}

/**
 * Update CRM entry status
 */
export async function updateStatus(id: string, status: CrmStatus) {
  const validStatuses: CrmStatus[] = [
    'novo_lead',
    'contato_feito',
    'respondeu',
    'negociacao',
    'cliente',
    'perdido',
  ];

  if (!validStatuses.includes(status)) {
    throw new AppError(400, `Status inválido: ${status}`);
  }

  return prisma.crmEntry.update({
    where: { id },
    data: { status },
    include: {
      company: { select: { name: true, category: true, city: true } },
    },
  });
}

/**
 * Get all CRM entries grouped by status
 */
export async function getAllLeads() {
  return prisma.crmEntry.findMany({
    include: {
      company: {
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          phone: true,
          whatsapp: true,
          rating: true,
        },
      },
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Add a note to a CRM entry
 */
export async function addNote(crmEntryId: string, content: string) {
  const entry = await prisma.crmEntry.findUnique({ where: { id: crmEntryId } });
  if (!entry) {
    throw new AppError(404, 'Entrada CRM não encontrada');
  }

  return prisma.crmNote.create({
    data: { crmEntryId, content },
  });
}

/**
 * Get all notes for a CRM entry
 */
export async function getNotes(crmEntryId: string) {
  return prisma.crmNote.findMany({
    where: { crmEntryId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Remove a company from the CRM
 */
export async function removeFromCrm(id: string) {
  return prisma.crmEntry.delete({ where: { id } });
}
