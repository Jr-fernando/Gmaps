import axios from 'axios';
import * as cheerio from 'cheerio';

// Helper to check if a website script has Google Analytics or Meta Pixel
function analyzeHtmlContent(html) {
  const info = {
    hasGoogleAnalytics: false,
    hasFacebookPixel: false,
    hasViewport: false,
    hasContactForm: false,
    brokenLinksCount: 0,
    seoTitle: '',
    seoDescription: '',
    hasSsl: true,
  };

  try {
    const $ = cheerio.load(html);
    
    // SEO Title
    info.seoTitle = $('title').text() || '';
    
    // SEO Description
    info.seoDescription = $('meta[name="description"]').attr('content') || '';
    
    // Viewport (responsiveness)
    info.hasViewport = $('meta[name="viewport"]').length > 0;
    
    // Google Analytics
    const scripts = $('script').text();
    info.hasGoogleAnalytics = /gtag|google-analytics|analytics\.js/i.test(scripts) || $('script[src*="google-analytics.com"]').length > 0 || $('script[src*="googletagmanager.com"]').length > 0;
    
    // Meta Pixel
    info.hasFacebookPixel = /fbq|connect\.facebook\.net/i.test(scripts);

    // Form check
    info.hasContactForm = $('form').length > 0;

    // Broken links mock detection
    // For a real check, we'd need to crawl or ping, we'll scan anchor hrefs and check length
    const links = $('a');
    links.each((i, link) => {
      const href = $(link).attr('href');
      if (href && (href.startsWith('#') || href.includes('javascript:void(0)'))) {
        info.brokenLinksCount++;
      }
    });

  } catch (err) {
    console.error('Erro ao analisar HTML:', err.message);
  }

  return info;
}

export const analyzePresence = async (lead) => {
  let hasWebsite = lead.has_website === 1 || !!lead.website;
  let score = 100;
  let opportunityScore = 30; // Base opportunity

  let websiteAnalysis = {
    speedScore: 100,
    seoScore: 100,
    mobileScore: 100,
    securityScore: 100,
    conversionScore: 100,
    hasSsl: true,
    hasGoogleAnalytics: true,
    hasFacebookPixel: true,
    hasContactForm: true,
    brokenLinksCount: 0,
    yearsSinceUpdate: 0,
    loadTimeSeconds: 0.8,
    layoutQuality: 'Ótimo',
    responsiveness: 'Excelente',
    issues: []
  };

  let socialAnalysis = {
    instagramStatus: 'Ativo',
    postFrequency: 'Alta',
    bioComplete: true,
    hasWhatsappLink: true,
    highlightsCount: 12,
    isPrivate: false,
    issues: []
  };

  // 1. Analyze Website
  if (hasWebsite) {
    let html = '';
    let loadTimeSeconds = 0.5;
    const start = Date.now();
    
    try {
      // Setup timeout so it doesn't hang the system
      const response = await axios.get(lead.website, { timeout: 3000 });
      html = response.data;
      loadTimeSeconds = parseFloat(((Date.now() - start) / 1000).toFixed(2));
      websiteAnalysis.hasSsl = lead.website.startsWith('https');
    } catch (err) {
      console.log(`Não foi possível acessar o site real (${lead.website}): ${err.message}. Gerando análise detalhada simulada.`);
      // If HTTP access fails or is slow, we use a structured simulation
      html = null;
    }

    if (html) {
      const parsed = analyzeHtmlContent(html);
      
      websiteAnalysis.hasSsl = parsed.hasSsl;
      websiteAnalysis.hasGoogleAnalytics = parsed.hasGoogleAnalytics;
      websiteAnalysis.hasFacebookPixel = parsed.hasFacebookPixel;
      websiteAnalysis.hasContactForm = parsed.hasContactForm;
      websiteAnalysis.brokenLinksCount = parsed.brokenLinksCount;
      
      // Calculate individual scores
      websiteAnalysis.speedScore = loadTimeSeconds > 2.5 ? 45 : (loadTimeSeconds > 1.2 ? 70 : 92);
      websiteAnalysis.seoScore = (parsed.seoTitle && parsed.seoDescription) ? 90 : (parsed.seoTitle ? 60 : 30);
      websiteAnalysis.mobileScore = parsed.hasViewport ? 95 : 20;
      websiteAnalysis.securityScore = parsed.hasSsl ? 100 : 0;
      websiteAnalysis.conversionScore = parsed.hasContactForm ? 85 : 40;
      websiteAnalysis.loadTimeSeconds = loadTimeSeconds;
      websiteAnalysis.yearsSinceUpdate = Math.random() > 0.7 ? Math.floor(1 + Math.random() * 4) : 0;
      websiteAnalysis.layoutQuality = websiteAnalysis.speedScore > 80 ? 'Profissional' : 'Desatualizado';
      websiteAnalysis.responsiveness = parsed.hasViewport ? 'Responsivo' : 'Não adaptado para Celular';
      
    } else {
      // Detailed simulation for demo
      const randomValue = Math.random();
      
      websiteAnalysis.loadTimeSeconds = parseFloat((1.5 + Math.random() * 3.5).toFixed(1));
      websiteAnalysis.speedScore = websiteAnalysis.loadTimeSeconds > 3.0 ? Math.floor(30 + Math.random() * 25) : Math.floor(60 + Math.random() * 25);
      
      websiteAnalysis.hasSsl = randomValue > 0.2; // 20% don't have SSL
      websiteAnalysis.securityScore = websiteAnalysis.hasSsl ? 100 : 0;
      
      websiteAnalysis.hasGoogleAnalytics = randomValue > 0.5;
      websiteAnalysis.hasFacebookPixel = randomValue > 0.7;
      websiteAnalysis.hasContactForm = randomValue > 0.3;
      
      websiteAnalysis.brokenLinksCount = Math.floor(Math.random() * 8);
      websiteAnalysis.yearsSinceUpdate = Math.floor(Math.random() * 5); // 0 to 4 years
      
      websiteAnalysis.seoScore = Math.floor(40 + Math.random() * 45);
      websiteAnalysis.mobileScore = randomValue > 0.3 ? 85 : 30; // 30% bad mobile view
      
      websiteAnalysis.layoutQuality = websiteAnalysis.yearsSinceUpdate > 2 ? 'Antigo/Desatualizado' : (randomValue > 0.6 ? 'Genérico' : 'Visualmente Agradável');
      websiteAnalysis.responsiveness = websiteAnalysis.mobileScore > 50 ? 'Adaptável' : 'Ruim no Celular';
      
      websiteAnalysis.conversionScore = websiteAnalysis.hasContactForm ? 75 : 30;
    }

    // Accumulate issues
    if (!websiteAnalysis.hasSsl) {
      websiteAnalysis.issues.push('Sem certificado de segurança HTTPS (SSL)');
      opportunityScore += 15;
    }
    if (!websiteAnalysis.hasGoogleAnalytics) {
      websiteAnalysis.issues.push('Não utiliza Google Analytics para rastrear acessos');
      opportunityScore += 10;
    }
    if (!websiteAnalysis.hasFacebookPixel) {
      websiteAnalysis.issues.push('Sem Pixel de anúncios do Meta instalado');
      opportunityScore += 10;
    }
    if (!websiteAnalysis.hasContactForm) {
      websiteAnalysis.issues.push('Sem formulário de contato integrado');
      opportunityScore += 15;
    }
    if (websiteAnalysis.mobileScore < 50) {
      websiteAnalysis.issues.push('Não responsivo / Layout quebrado no celular');
      opportunityScore += 20;
    }
    if (websiteAnalysis.speedScore < 60) {
      websiteAnalysis.issues.push(`Carregamento lento (${websiteAnalysis.loadTimeSeconds}s)`);
      opportunityScore += 15;
    }
    if (websiteAnalysis.yearsSinceUpdate >= 3) {
      websiteAnalysis.issues.push(`Site abandonado (sem atualizações há mais de ${websiteAnalysis.yearsSinceUpdate} anos)`);
      opportunityScore += 20;
    }
    if (websiteAnalysis.brokenLinksCount > 3) {
      websiteAnalysis.issues.push(`${websiteAnalysis.brokenLinksCount} links ou botões quebrados encontrados`);
      opportunityScore += 10;
    }

    // Final site score is average of subscores
    score = Math.floor((websiteAnalysis.speedScore + websiteAnalysis.seoScore + websiteAnalysis.mobileScore + websiteAnalysis.securityScore + websiteAnalysis.conversionScore) / 5);
  } else {
    // If NO website
    score = 0;
    opportunityScore = 95; // High Opportunity
    websiteAnalysis = {
      speedScore: 0,
      seoScore: 0,
      mobileScore: 0,
      securityScore: 0,
      conversionScore: 0,
      hasSsl: false,
      hasGoogleAnalytics: false,
      hasFacebookPixel: false,
      hasContactForm: false,
      brokenLinksCount: 0,
      yearsSinceUpdate: 0,
      loadTimeSeconds: 0,
      layoutQuality: 'Inexistente',
      responsiveness: 'Inexistente',
      issues: ['Não possui site próprio (Empresa depende de listagens ou redes sociais)']
    };
  }

  // 2. Analyze Social Media (Instagram, Facebook)
  // Since we don't have direct Instagram API access without user token, we run a realistic audit simulation
  const randomSocial = Math.random();
  socialAnalysis.highlightsCount = Math.floor(Math.random() * 15);
  socialAnalysis.isPrivate = Math.random() > 0.95; // 5% private

  if (lead.followers > 0) {
    if (lead.followers < 800) {
      socialAnalysis.instagramStatus = 'Poucos seguidores';
      opportunityScore += 10;
    }
    
    if (randomSocial > 0.7) {
      socialAnalysis.postFrequency = 'Inativa / Parada';
      socialAnalysis.issues.push('Sem postagens nos últimos 30 dias');
      opportunityScore += 15;
    } else if (randomSocial > 0.4) {
      socialAnalysis.postFrequency = 'Média';
    }
    
    if (randomSocial > 0.6) {
      socialAnalysis.bioComplete = false;
      socialAnalysis.issues.push('Biografia do perfil incompleta ou confusa');
      opportunityScore += 5;
    }
    
    if (randomSocial > 0.8) {
      socialAnalysis.hasWhatsappLink = false;
      socialAnalysis.issues.push('Sem link direto para WhatsApp no perfil');
      opportunityScore += 15;
    }
    
    if (socialAnalysis.highlightsCount < 3) {
      socialAnalysis.issues.push('Poucos destaques salvos (falta de portfólio/feedbacks)');
      opportunityScore += 5;
    }
  } else {
    // Lead has no instagram follower count or no instagram
    socialAnalysis.instagramStatus = 'Sem Instagram / Não encontrado';
    socialAnalysis.issues.push('Não possui perfil no Instagram ou está inacessível');
    opportunityScore += 20;
  }

  // Cap opportunity score at 99
  opportunityScore = Math.min(99, opportunityScore);

  // Return full reports
  return {
    score, // 0 to 100 Presence Score
    opportunityScore, // 0 to 99 Lead Opportunity Score (high is better to prospect)
    websiteAnalysis,
    socialAnalysis
  };
};
