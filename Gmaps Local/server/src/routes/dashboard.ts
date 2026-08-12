import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { startOfToday } from '../utils/helpers.js';
import type { DashboardStats } from '../types/index.js';

const router = Router();

router.get('/stats', async (_req, res, next) => {
  try {
    const today = startOfToday();

    const [totalCompanies, foundToday, analyzed, inCrm, lastSearch] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { createdAt: { gte: today } } }),
      prisma.analysis.count(),
      prisma.crmEntry.count(),
      prisma.searchLog.findFirst({ orderBy: { createdAt: 'desc' } }),
    ]);

    const stats: DashboardStats = {
      totalCompanies,
      foundToday,
      analyzed,
      inCrm,
      lastSearch: lastSearch
        ? {
            query: lastSearch.query,
            city: lastSearch.city,
            segment: lastSearch.segment,
            resultsCount: lastSearch.resultsCount,
            createdAt: lastSearch.createdAt.toISOString(),
          }
        : null,
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
