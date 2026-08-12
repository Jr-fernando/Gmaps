import { Router } from 'express';
import { getCompanies, getCompanyById, deleteCompany } from '../services/companyService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, city, category, page, limit } = req.query;

    const result = await getCompanies({
      search: search as string | undefined,
      city: city as string | undefined,
      category: category as string | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const company = await getCompanyById(req.params.id);

    if (!company) {
      throw new AppError(404, 'Empresa não encontrada');
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteCompany(req.params.id);
    res.json({ message: 'Empresa removida com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
