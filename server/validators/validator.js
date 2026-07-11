export const validateLeadSearch = (req, res, next) => {
  const { query, city } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'O termo de busca (nicho/segmento) é obrigatório e deve ser válido.' });
  }
  if (!city || typeof city !== 'string' || !city.trim()) {
    return res.status(400).json({ error: 'A cidade/localidade é obrigatória e deve ser válida.' });
  }
  
  // Sanitization
  req.body.query = query.trim().substring(0, 100);
  req.body.city = city.trim().substring(0, 100);
  next();
};

export const validateCrmUpdate = (req, res, next) => {
  const { status, owner, value_negotiated, probability } = req.body;
  
  if (status && typeof status !== 'string') {
    return res.status(400).json({ error: 'O status do CRM deve ser válido.' });
  }
  if (owner && typeof owner !== 'string') {
    return res.status(400).json({ error: 'O nome do responsável deve ser válido.' });
  }
  
  if (value_negotiated !== undefined) {
    const val = parseFloat(value_negotiated);
    if (isNaN(val) || val < 0) {
      return res.status(400).json({ error: 'O valor negociado deve ser um número positivo.' });
    }
    req.body.value_negotiated = val;
  }
  
  if (probability !== undefined) {
    const prob = parseInt(probability);
    if (isNaN(prob) || prob < 0 || prob > 100) {
      return res.status(400).json({ error: 'A probabilidade deve ser um número inteiro entre 0 e 100.' });
    }
    req.body.probability = prob;
  }
  
  next();
};
