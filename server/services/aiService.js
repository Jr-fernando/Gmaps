import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { dbGet } from '../db.js';

// Fallback Portuguese generator if no API key is provided
function generateLocalFallbackReport(lead, websiteAnalysis, socialAnalysis) {
  const issues = [...(websiteAnalysis.issues || []), ...(socialAnalysis.issues || [])];
  
  // Format list of issues
  let issuesList = '';
  if (issues.length > 0) {
    issuesList = issues.map(issue => `- ${issue}`).join('\n');
  } else {
    issuesList = '- Nenhuma falha crítica evidente. Presença digital sólida, mas sempre há margem para melhorias de automação.';
  }

  // Determine potential services to sell
  const services = [];
  if (lead.has_website === 0) {
    services.push('Desenvolvimento de Website / Landing Page responsiva');
    services.push('Configuração de Domínio e Hospedagem');
  } else {
    if (websiteAnalysis.mobileScore < 60) services.push('Redesenho de site focado em Mobile');
    if (websiteAnalysis.speedScore < 60) services.push('Otimização de velocidade de carregamento (Web Performance)');
    if (!websiteAnalysis.hasGoogleAnalytics || !websiteAnalysis.hasFacebookPixel) services.push('Configuração de Pixel Meta, Google Analytics e Tags de Rastreamento');
    if (websiteAnalysis.brokenLinksCount > 0) services.push('Manutenção corretiva de links e botões');
  }

  if (socialAnalysis.instagramStatus.includes('Sem Instagram') || socialAnalysis.postFrequency.includes('Inativa')) {
    services.push('Gestão e reestruturação de Redes Sociais');
    services.push('Criação de Identidade Visual e Artes para Feed/Stories');
  }

  if (!socialAnalysis.hasWhatsappLink || lead.whatsapp) {
    services.push('Automação de WhatsApp (Chatbot inteligente de atendimento)');
    services.push('Integração de WhatsApp com CRM interno');
  }

  // Build AI Report
  const aiReport = `### 📋 Relatório de Oportunidade - ${lead.name}
**Segmento:** ${lead.segment || 'Serviços/Vendas'}
**Nota de Presença Digital:** ${lead.has_website === 0 ? '0/100 (Sem site)' : `${Math.round(websiteAnalysis.speedScore * 0.4 + websiteAnalysis.seoScore * 0.6)}/100`}
**Prioridade de Prospecção:** ${lead.opportunity_score >= 80 ? '🔴 PRIORIDADE ALTA' : (lead.opportunity_score >= 50 ? '🟡 PRIORIDADE MÉDIA' : '🟢 PRIORIDADE BAIXA')}

#### 🔍 Pontos Fracos Identificados:
${issuesList}

#### 💡 Soluções Recomendadas (Oportunidades de Venda):
${services.map(s => `- **${s}**`).join('\n')}

#### 📈 Diagnóstico Comercial:
A empresa **${lead.name}** possui um potencial de vendas incrível na região de **${lead.city}/${lead.state}**. ${lead.rating ? `Com uma nota excelente no Google Maps (${lead.rating} estrelas em ${lead.reviews_count} avaliações), os clientes já adoram o serviço presencial.` : ''} No entanto, ${lead.has_website === 0 ? 'a falta de um site oficial faz com que eles percam dezenas de leads diários que buscam ativamente por esses serviços na web e acabam fechando com concorrentes que possuem site.' : 'o site atual apresenta gargalos técnicos que prejudicam a conversão de novos clientes.'}

**Potencial de Venda:** ${lead.opportunity_score >= 80 ? 'Excelente (Sem barreira técnica e alta necessidade imediata)' : 'Moderado (Upgrade/Otimização)'}`;

  // Build highly personalized message
  let firstMessage = '';
  const greeting = 'Olá, tudo bem?';
  const intro = `Conheci o trabalho da **${lead.name}** em ${lead.city} e vi que vocês têm ótimas avaliações no Google (${lead.rating} estrelas!).`;
  
  if (lead.has_website === 0) {
    firstMessage = `${greeting}
    
${intro} Notei que vocês ainda não possuem um site próprio ou uma Landing Page estruturada. Hoje, isso faz com que muitos clientes em potencial decidam fechar com concorrentes locais.

Eu trabalho ajudando empresas de **${lead.segment}** a criarem sites modernos e rápidos, integrados com WhatsApp e automações de atendimento por Inteligência Artificial. Isso ajuda a capturar clientes 24h por dia.

Caso faça sentido para você, eu preparei um diagnóstico simples com melhorias para a sua presença digital. Posso te enviar por aqui?`;
  } else {
    firstMessage = `${greeting}
    
${intro} Dei uma olhada no site de vocês (${lead.website}) e notei que ${websiteAnalysis.mobileScore < 60 ? 'ele ainda não está totalmente adaptado para visualização no celular' : (websiteAnalysis.speedScore < 60 ? 'ele está demorando um pouco para carregar' : 'ele poderia se beneficiar de um layout mais moderno e automação de atendimento')}.

Sou especialista em estruturação digital para o segmento de **${lead.segment}**. Ajudamos a otimizar o carregamento de sites, melhorar o SEO para atrair clientes locais e integrar chatbots de WhatsApp que realizam agendamentos e tiram dúvidas automaticamente.

Gostaria de receber uma análise gratuita e rápida sobre o que pode ser melhorado para vocês venderem mais?`;
  }

  return { aiReport, firstMessage };
}

// Fetch API Key helper
async function getApiKey(type) {
  try {
    const setting = await dbGet('SELECT value FROM settings WHERE key = ?', [`${type}_api_key`]);
    return setting ? setting.value : '';
  } catch (err) {
    return '';
  }
}

export const generateAiReport = async (lead, websiteAnalysis, socialAnalysis) => {
  const geminiKey = await getApiKey('gemini');
  const openaiKey = await getApiKey('openai');
  const claudeKey = await getApiKey('claude');

  const prompt = `Analise a empresa e gere um relatório detalhado em Markdown em português do Brasil e uma mensagem personalizada de prospecção.
  
  Dados da Empresa:
  - Nome: ${lead.name}
  - Segmento: ${lead.segment}
  - Cidade/Estado: ${lead.city}/${lead.state}
  - Nota Google Maps: ${lead.rating} (${lead.reviews_count} avaliações)
  - Tem Site: ${lead.has_website === 1 ? 'Sim' : 'Não'}
  - URL do Site: ${lead.website || 'Nenhum'}
  - Seguidores Instagram: ${lead.followers || 'Desconhecido'}
  
  Análise de Website:
  ${JSON.stringify(websiteAnalysis, null, 2)}
  
  Análise de Redes Sociais:
  ${JSON.stringify(socialAnalysis, null, 2)}
  
  Você deve responder com um JSON exatamente neste formato:
  {
    "aiReport": "O relatório em Markdown detalhado (pontos fracos, oportunidades, diagnóstico comercial)",
    "firstMessage": "Uma mensagem personalizada de abordagem em português. Deve ser natural, sem jargões excessivos, amigável, citando dados reais como avaliações ou a falta de site, propondo uma melhoria gratuita ou bate-papo de 10 min. NÃO invente dados que não estão listados acima."
  }`;

  // 1. Try Gemini
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      console.log('Utilizando Gemini para análise do lead...');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (err) {
      console.error('Falha no Gemini, tentando fallback local:', err.message);
    }
  }

  // 2. Try OpenAI
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      console.log('Utilizando OpenAI para análise do lead...');
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      const text = response.choices[0].message.content;
      return JSON.parse(text);
    } catch (err) {
      console.error('Falha na OpenAI, tentando fallback local:', err.message);
    }
  }

  // 3. Fallback if no APIs are set
  console.log('Sem chaves de API ativas. Usando gerador heurístico local para análise...');
  return generateLocalFallbackReport(lead, websiteAnalysis, socialAnalysis);
};

export const generateProposalText = async (lead, selectedServices) => {
  const geminiKey = await getApiKey('gemini');
  const openaiKey = await getApiKey('openai');

  const servicesText = selectedServices.map(s => `- ${s}`).join('\n');
  const prompt = `Crie uma proposta comercial e orçamento formal em português do Brasil para a empresa:
  - Nome: ${lead.name}
  - Segmento: ${lead.segment}
  - Cidade: ${lead.city}
  
  Serviços Selecionados:
  ${servicesText}
  
  A proposta deve incluir:
  1. Introdução / Diagnóstico do negócio.
  2. Escopo dos Serviços com detalhes de cada item selecionado.
  3. Cronograma estimado de entrega.
  4. Investimento e Condições de pagamento (defina valores de mercado plausíveis em Reais (R$) para os itens).
  5. Próximos passos para fechamento.
  
  Escreva em formato Markdown limpo e profissional.`;

  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error('Erro na geração da proposta pelo Gemini:', err.message);
    }
  }

  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('Erro na geração da proposta pela OpenAI:', err.message);
    }
  }

  // Local fallback proposal generator
  const servicesList = selectedServices.map(s => {
    let desc = 'Serviço profissional personalizado.';
    let price = 'R$ 1.500,00';
    
    if (s.includes('Website') || s.includes('Landing Page')) {
      desc = 'Criação de site responsivo moderno com até 5 páginas, otimizado para SEO local e velocidade, incluindo integrações com formulários de contato.';
      price = 'R$ 2.200,00';
    } else if (s.includes('E-commerce')) {
      desc = 'Loja virtual com cadastro de até 50 produtos, meios de pagamento (Pix/Cartão) e frete (Correios/Melhor Envio) configurados.';
      price = 'R$ 4.500,00';
    } else if (s.includes('Automação de WhatsApp') || s.includes('Chatbots')) {
      desc = 'Configuração de fluxo conversacional inteligente para atendimento automático, agendamento de reuniões e qualificação de leads 24h.';
      price = 'R$ 1.800,00';
    } else if (s.includes('Identidade Visual') || s.includes('Design')) {
      desc = 'Desenvolvimento de logotipo profissional, paleta de cores, tipografia institucional e 5 templates editáveis para postagens.';
      price = 'R$ 1.200,00';
    } else if (s.includes('SEO') || s.includes('Tráfego')) {
      desc = 'Otimização completa do Google Meu Negócio e SEO On-Page do site para aparecer na primeira página das buscas locais.';
      price = 'R$ 900,00/mês';
    } else if (s.includes('Integrações')) {
      desc = 'Conexão entre WhatsApp, Notion, Google Sheets e CRM de vendas para sincronizar contatos e dados automaticamente.';
      price = 'R$ 1.000,00';
    }

    return `### ⚙️ ${s}
- **Descrição:** ${desc}
- **Investimento:** ${price}`;
  }).join('\n\n');

  const totalValue = selectedServices.reduce((acc, curr) => {
    if (curr.includes('Website') || curr.includes('Landing Page')) return acc + 2200;
    if (curr.includes('E-commerce')) return acc + 4500;
    if (curr.includes('WhatsApp') || curr.includes('Chatbots')) return acc + 1800;
    if (curr.includes('Identidade Visual') || curr.includes('Design')) return acc + 1200;
    if (curr.includes('SEO')) return acc + 900;
    if (curr.includes('Integrações')) return acc + 1000;
    return acc + 1500;
  }, 0);

  return `# PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS DIGITAIS
**Cliente:** ${lead.name}
**Data:** ${new Date().toLocaleDateString('pt-BR')}

---

## 🎯 1. Objetivo e Diagnóstico Comercial
Identificamos excelentes oportunidades para alavancar a atração de clientes da **${lead.name}** em **${lead.city}/${lead.state}**. Atualmente, com a otimização dos canais digitais e automação dos processos, estimamos um aumento significativo no volume de leads diários qualificados.

---

## 🛠️ 2. Escopo dos Serviços e Valores

${servicesList}

---

## 📅 3. Cronograma e Entregas
O projeto será desenvolvido em etapas estruturadas:
- **Etapa 1 (Semana 1):** Briefing de design, coleta de materiais e definição da identidade visual/layout.
- **Etapa 2 (Semana 2 a 3):** Desenvolvimento técnico e programação dos fluxos de automação.
- **Etapa 3 (Semana 4):** Homologação, treinamento de uso e publicação/lançamento oficial.

---

## 💰 4. Resumo do Investimento e Pagamento
- **Investimento Total:** R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Forma de Pagamento:** 
  - Opção A: 50% de entrada e 50% na entrega.
  - Opção B: Parcelamento em até 3x sem juros no cartão de crédito.
  - Opção C: Desconto de 10% para pagamento à vista no Pix.

---

## 🚀 5. Próximos Passos
Para dar início ao projeto, basta entrar em contato clicando no botão abaixo ou respondendo a este e-mail. Elaboraremos o contrato digital e daremos início ao briefing técnico na mesma semana!
`;
};

export const chatWithLeadAi = async (lead, userMessage, history = []) => {
  const geminiKey = await getApiKey('gemini');
  const openaiKey = await getApiKey('openai');

  const systemInstructions = `Você é um agente comercial e assistente de prospecção da agência de serviços digitais.
  Você está analisando a empresa ${lead.name} (${lead.segment}) na cidade de ${lead.city}/${lead.state}.
  Responda à solicitação do usuário gerando o conteúdo necessário (como e-mails, ajustes de orçamentos, respostas a dúvidas de clientes). 
  Sempre responda de forma prestativa, profissional e orientada a fechar vendas. Mantenha o foco em português do Brasil.`;

  const messagesList = [
    { role: 'system', content: systemInstructions },
    ...history.map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
    { role: 'user', content: userMessage }
  ];

  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const combinedPrompt = `${systemInstructions}\n\nHistórico:\n${history.map(h => `${h.sender}: ${h.text}`).join('\n')}\n\nUser: ${userMessage}`;
      const result = await model.generateContent(combinedPrompt);
      return result.response.text();
    } catch (err) {
      console.error('Gemini chat error, falling back:', err.message);
    }
  }

  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messagesList
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('OpenAI chat error, falling back:', err.message);
    }
  }

  // Fallback chat responses
  const msgLower = userMessage.toLowerCase();
  if (msgLower.includes('orçamento') || msgLower.includes('preço') || msgLower.includes('custo')) {
    return `Olá! Analisando a empresa **${lead.name}**, posso propor um orçamento inicial focado em desenvolvimento de Landing Page e automação de atendimento por WhatsApp. O valor ficaria em torno de R$ 3.500,00, podendo ser parcelado em até 3x. Deseja que eu elabore uma proposta comercial em PDF com este valor?`;
  }
  if (msgLower.includes('whatsapp') || msgLower.includes('mensagem')) {
    return `Com base na presença de **${lead.name}**, sugiro enviar uma mensagem focada no fato de que eles possuem ótimas avaliações no Google Maps, mas não possuem site para fechar o contato direto. Veja este rascunho:\n\n"Olá! Vi suas ótimas avaliações no Google. Gostaria de saber se têm interesse em criar um site para automatizar os agendamentos pelo WhatsApp?"`;
  }

  return `Entendi sua solicitação sobre a empresa **${lead.name}**. Posso te ajudar a redigir mensagens, criar escopos específicos de serviço ou tirar dúvidas para preparar a reunião comercial. Como deseja prosseguir?`;
};
