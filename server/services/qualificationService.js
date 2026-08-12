const clamp = (value, min = 0, max = 100) => Math.min(Math.max(Math.round(value), min), max);

const SERVICE_LABELS = {
  social_media: 'gestão de social media',
  website: 'site ou landing page',
  whatsapp: 'WhatsApp e automação',
  traffic: 'tráfego pago',
};

export const qualifyLead = (lead, need = 'social_media') => {
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

  const qualification = {
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

  return {
    ...lead,
    has_website: hasWebsite ? 1 : 0,
    opportunity_score: opportunity,
    website_analysis: { qualification, issues: reasons, auditStatus: hasWebsite ? 'pending' : 'not_applicable' },
    social_analysis: {
      qualification,
      instagramStatus: 'Não verificado pelo Google Places',
      issues: need === 'social_media' ? reasons : [],
    },
    ai_report: `### Oportunidade para ${serviceLabel}\n\n**Vulnerabilidade:** ${vulnerability}/100\n\n**Dificuldade estimada:** ${difficultyLabel} (${difficulty}/100)\n\n${reasons.map((reason) => `- ${reason}`).join('\n')}\n\nEsta é uma triagem inicial com dados públicos. Use **Reanalisar IA** no perfil para aprofundar a auditoria.`,
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
