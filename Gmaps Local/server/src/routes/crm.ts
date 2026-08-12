import { Router } from 'express';
import { z } from 'zod';
import * as crmService from '../services/crmService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CrmStatus } from '../types/index.js';

const router = Router();

// List all leads
router.get('/', async (_req, res, next) => {
  try {
    const leads = await crmService.getAllLeads();
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

// Add company to CRM
router.post('/:companyId', async (req, res, next) => {
  try {
    const entry = await crmService.addToCrm(req.params.companyId);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// Update lead status
const statusSchema = z.object({
  status: z.enum([
    'novo_lead',
    'contato_feito',
    'respondeu',
    'negociacao',
    'cliente',
    'perdido',
  ]),
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Status inválido');
    }

    const entry = await crmService.updateStatus(req.params.id, parsed.data.status as CrmStatus);
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// Add note to CRM entry
const noteSchema = z.object({
  content: z.string().min(1, 'Conteúdo da observação é obrigatório'),
});

router.post('/:id/notes', async (req, res, next) => {
  try {
    const parsed = noteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0].message);
    }

    const note = await crmService.addNote(req.params.id, parsed.data.content);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// Get notes for CRM entry
router.get('/:id/notes', async (req, res, next) => {
  try {
    const notes = await crmService.getNotes(req.params.id);
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// Remove from CRM
router.delete('/:id', async (req, res, next) => {
  try {
    await crmService.removeFromCrm(req.params.id);
    res.json({ message: 'Removido do CRM' });
  } catch (error) {
    next(error);
  }
});

export default router;
