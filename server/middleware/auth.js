import dotenv from 'dotenv';

dotenv.config();
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

/**
 * Protect the API when an administrator token is configured. Production
 * deployments must define ADMIN_API_KEY; local development stays frictionless.
 */
export const requireApiAuth = (req, res, next) => {
  const configuredToken = process.env.ADMIN_API_KEY;

  if (!configuredToken) {
    if (isProduction) {
      return res.status(503).json({ error: 'API indisponível: ADMIN_API_KEY não configurada.' });
    }
    return next();
  }

  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (token !== configuredToken) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  return next();
};
