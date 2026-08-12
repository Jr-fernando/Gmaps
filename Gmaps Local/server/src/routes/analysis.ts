import { Router } from 'express';
import { analyzeCompany } from '../services/gemini.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Generate analysis for a company
router.post('/:companyId', async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new AppError(500, 'GEMINI_API_KEY não configurada no .env');
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new AppError(404, 'Empresa não encontrada');
    }

    const result = await analyzeCompany(
      {
        name: company.name,
        category: company.category,
        phone: company.phone,
        website: company.website,
        instagram: company.instagram,
        address: company.address,
        city: company.city,
        rating: company.rating,
        totalReviews: company.totalReviews,
      },
      apiKey,
    );

    // Upsert the analysis
    const analysis = await prisma.analysis.upsert({
      where: { companyId },
      create: {
        companyId,
        score: result.score,
        summary: result.summary,
        problems: JSON.stringify(result.problems),
        opportunities: JSON.stringify(result.opportunities),
        recommendedServices: JSON.stringify(result.recommendedServices),
        priority: result.priority,
        prospectMessage: result.prospectMessage,
      },
      update: {
        score: result.score,
        summary: result.summary,
        problems: JSON.stringify(result.problems),
        opportunities: JSON.stringify(result.opportunities),
        recommendedServices: JSON.stringify(result.recommendedServices),
        priority: result.priority,
        prospectMessage: result.prospectMessage,
      },
    });

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// Get existing analysis for a company
router.get('/:companyId', async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const analysis = await prisma.analysis.findUnique({
      where: { companyId },
    });

    if (!analysis) {
      throw new AppError(404, 'Análise não encontrada para esta empresa');
    }

    // Parse JSON fields
    res.json({
      ...analysis,
      problems: analysis.problems ? JSON.parse(analysis.problems) : [],
      opportunities: analysis.opportunities ? JSON.parse(analysis.opportunities) : [],
      recommendedServices: analysis.recommendedServices
        ? JSON.parse(analysis.recommendedServices)
        : [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
