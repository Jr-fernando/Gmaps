import { Router } from 'express';
import { z } from 'zod';
import { searchPlaces } from '../services/googlePlaces.js';
import { upsertCompanies } from '../services/companyService.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const searchSchema = z.object({
  city: z.string().min(2, 'Cidade é obrigatória (mín. 2 caracteres)'),
  segment: z.string().min(2, 'Segmento é obrigatório (mín. 2 caracteres)'),
  radius: z.number().min(1).max(50).default(10),
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = searchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0].message);
    }

    const { city, segment, radius } = parsed.data;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      throw new AppError(500, 'GOOGLE_PLACES_API_KEY não configurada no .env');
    }

    // Search Google Places
    const companies = await searchPlaces(city, segment, radius, apiKey);

    // Upsert into database (skip duplicates)
    const { created, skipped } = await upsertCompanies(companies);

    // Log the search
    const query = `${segment} em ${city}`;
    await prisma.searchLog.create({
      data: {
        query,
        city,
        segment,
        radius,
        resultsCount: companies.length,
      },
    });

    res.json({
      message: `Pesquisa concluída: ${companies.length} encontradas, ${created} novas, ${skipped} já existentes`,
      total: companies.length,
      created,
      skipped,
      companies,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (_req, res, next) => {
  try {
    const history = await prisma.searchLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

export default router;
