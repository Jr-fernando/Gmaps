const clamp = (value, min = 0, max = 100) => Math.min(Math.max(Math.round(value), min), max);

const SERVICE_LABELS = {
  social_media: 'gestão de social media',
  content: 'edição e criação de conteúdo',
  website: 'site ou landing page',
  whatsapp: 'WhatsApp e automação',
  traffic: 'tráfego pago',
};

const qualifyForService = (lead, need = 'social_media') => {
  const hasWebsite = Boolean(lead.website);
  const hasPhone = Boolean(lead.phone || lead.whatsapp);
  const rating = Number(lead.rating || 0);
  const reviews = Number(lead.reviews_count || 0);
  const reputation = clamp((rating / 5) * 55 + Math.min(Math.log10(reviews + 1) * 20, 45));
  const contactability = clamp((hasPhone ? 70 : 10) + (hasWebsite ? 20 : 0) + (lead.gmaps_link ? 10 : 0));
  const reasons = [];
  let vulnerability = 45;

  if (need === 'website') {
    vulnerability = hasWebsite ? 32 : 96;
    reasons.push(hasWebsite ? 'Já possui site; exige uma auditoria de qualidade' : 'Não possui site oficial identificado');
  } else if (need === 'whatsapp') {
    vulnerability = hasPhone ? (hasWebsite ? 48 : 72) : 84;
    reasons.push(hasPhone ? 'Telefone disponível para uma abordagem direta' : 'Sem telefone público identificado');
    if (!hasWebsite) reasons.push('Sem funil próprio para converter visitas em contatos');
  } else if (need === 'traffic') {
    vulnerability = clamp(38 + reputation * 0.45 + (hasWebsite ? 0 : 12));
    reasons.push(reputation >= 65 ? 'Boa reputação local para transformar em campanhas' : 'Reputação digital ainda em desenvolvimento');
  } else if (need === 'content') {
    vulnerability = clamp(42 + (reputation >= 60 ? 24 : 8) + (hasWebsite ? 0 : 10));
    reasons.push(reputation >= 60 ? 'Avaliações fornecem material para conteúdo de prova social' : 'Conteúdo pode fortalecer a autoridade local');
    if (reviews >= 30) reasons.push('Volume de clientes permite criar casos e depoimentos');
  } else {
    // Google Places does not expose Instagram data. This is an opportunity
    // estimate based on public local presence, never a claim that Instagram is absent.
    vulnerability = clamp(46 + (hasWebsite ? 0 : 18) + (reputation >= 60 ? 18 : 5));
    reasons.push('Instagram não é informado pelo Google Places e precisa ser validado');
    if (reputation >= 60) reasons.push('Boa prova social no Google para reaproveitar nas redes');
    if (!hasWebsite) reasons.push('Presença digital dependente de plataformas de terceiros');
  }

  if (reviews >= 30) reasons.push(`${reviews} avaliações demonstram demanda local`);
  if (hasPhone) reasons.push('Contato telefônico disponível');

  const companyComplexity = reviews >= 300 ? 25 : reviews >= 100 ? 15 : reviews >= 30 ? 8 : 0;
  const difficulty = clamp(72 - vulnerability * 0.45 - contactability * 0.25 + companyComplexity);
  const opportunity = clamp(vulnerability * 0.55 + contactability * 0.25 + reputation * 0.2);
  const difficultyLabel = difficulty <= 30 ? 'Fácil' : difficulty <= 60 ? 'Médio' : 'Difícil';
  const serviceLabel = SERVICE_LABELS[need] || SERVICE_LABELS.social_media;

  return {
    targetService: need,
    serviceLabel,
    vulnerabilityScore: vulnerability,
    difficultyScore: difficulty,
    difficultyLabel,
    contactabilityScore: contactability,
    reputationScore: reputation,
    reasons: reasons.slice(0, 4),
    socialDataVerified: false,
  };
};

export const qualifyLead = (lead, requestedNeeds = ['social_media']) => {
  const needs = Array.isArray(requestedNeeds) ? requestedNeeds : [requestedNeeds];
  const serviceMatches = needs.map((need) => qualifyForService(lead, need));
  const bestMatch = serviceMatches.reduce((best, current) => current.vulnerabilityScore > best.vulnerabilityScore ? current : best, serviceMatches[0]);
  const averageVulnerability = clamp(serviceMatches.reduce((total, item) => total + item.vulnerabilityScore, 0) / serviceMatches.length);
  const averageDifficulty = clamp(serviceMatches.reduce((total, item) => total + item.difficultyScore, 0) / serviceMatches.length);
  const reasons = [...new Set(serviceMatches.flatMap((item) => item.reasons))].slice(0, 6);
  const serviceLabel = serviceMatches.map((item) => item.serviceLabel).join(', ');
  const qualification = {
    ...bestMatch,
    targetServices: needs,
    serviceLabel,
    vulnerabilityScore: averageVulnerability,
    difficultyScore: averageDifficulty,
    difficultyLabel: averageDifficulty <= 30 ? 'Fácil' : averageDifficulty <= 60 ? 'Médio' : 'Difícil',
    reasons,
    serviceMatches,
  };
  const hasWebsite = Boolean(lead.website);
  const opportunity = clamp(qualification.vulnerabilityScore * 0.65 + qualification.contactabilityScore * 0.2 + qualification.reputationScore * 0.15);

  return {
    ...lead,
    has_website: hasWebsite ? 1 : 0,
    opportunity_score: opportunity,
    website_analysis: { qualification, issues: reasons, auditStatus: hasWebsite ? 'pending' : 'not_applicable' },
    social_analysis: {
      qualification,
      instagramStatus: 'Não verificado pelo Google Places',
      issues: needs.includes('social_media') ? reasons : [],
    },
    ai_report: `### Oportunidades: ${serviceLabel}\n\n**Vulnerabilidade combinada:** ${qualification.vulnerabilityScore}/100\n\n**Dificuldade estimada:** ${qualification.difficultyLabel} (${qualification.difficultyScore}/100)\n\n${reasons.map((reason) => `- ${reason}`).join('\n')}\n\nEsta é uma triagem inicial com dados públicos. Use **Reanalisar IA** no perfil para aprofundar a auditoria.`,
    first_message: `Olá! Encontrei a ${lead.name} ao analisar empresas de ${lead.segment} em ${lead.city}. Vi uma oportunidade em ${serviceLabel} que pode ajudar a transformar a presença local em mais contatos. Posso te enviar um diagnóstico curto, sem compromisso?`,
  };
};

export const sortQualifiedLeads = (leads, sortMode = 'vulnerable') => {
  const score = (lead, key, fallback = 0) => Number(lead.website_analysis?.qualification?.[key] ?? fallback);
  return [...leads].sort((a, b) => {
    if (sortMode === 'easiest') return score(a, 'difficultyScore', 100) - score(b, 'difficultyScore', 100);
    if (sortMode === 'hardest') return score(b, 'difficultyScore') - score(a, 'difficultyScore');
    if (sortMode === 'reputation') return score(b, 'reputationScore') - score(a, 'reputationScore');
    return score(b, 'vulnerabilityScore') - score(a, 'vulnerabilityScore');
  });
};
