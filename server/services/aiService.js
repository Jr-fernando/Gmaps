import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { dbService } from './dbService.js';

// Fallback Portuguese generator if no API key is provided
function generateLocalFallbackReport(lead, websiteAnalysis, socialAnalysis) {
  const issues = [...(websiteAnalysis.issues || []), ...(socialAnalysis.issues || [])];
  const companySize = lead.reviews_count > 150 || lead.followers > 5000 
    ? 'Grande / Alta Relevância Local' 
    : (lead.reviews_count > 30 || lead.followers > 1000 ? 'Média' : 'Pequena / Microempresa');

  // Determine potential services to sell
  const services = [];
  if (lead.has_website === 0) {
    services.push('Desenvolvimento de Website / Landing Page responsiva');
  } else {
    if (websiteAnalysis.mobileScore < 60) services.push('Redesenho de site focado em Mobile');
    if (websiteAnalysis.speedScore < 60) services.push('Otimização de velocidade de carregamento (Web Performance)');
    if (!websiteAnalysis.hasGoogleAnalytics || !websiteAnalysis.hasFacebookPixel) services.push('Configuração de Pixel Meta, Google Analytics e Tráfego Pago');
    if (websiteAnalysis.brokenLinksCount > 0) services.push('Redesign e Manutenção de Site');
  }
  if (socialAnalysis.instagramStatus?.includes('Sem Instagram') || socialAnalysis.postFrequency?.includes('Inativa')) {
    services.push('Gestão de Redes Sociais');
  }
  if (!socialAnalysis.hasWhatsappLink || lead.whatsapp) {
    services.push('Automação de WhatsApp (Chatbot inteligente)');
  }

  // Answer diagnostic questions
  const q1 = lead.has_website === 1 ? 'Sim. Site oficial configurado.' : 'Não. A empresa não possui site próprio.';
  const q2 = lead.has_website === 1 && websiteAnalysis.yearsSinceUpdate < 2 ? 'Sim. Visual moderno e atualizado.' : (lead.has_website === 1 ? 'Não. Layout antigo/desatualizado.' : 'Não aplicável (sem site).');
  const q3 = lead.has_website === 1 && websiteAnalysis.mobileScore >= 60 ? 'Sim. Adaptado para celulares.' : (lead.has_website === 1 ? 'Não. Problemas de responsividade.' : 'Não aplicável (sem site).');
  const q4 = lead.has_website === 1 && websiteAnalysis.seoScore >= 60 ? 'Sim. Tags SEO básicas presentes.' : (lead.has_website === 1 ? 'Não. SEO fraco ou ausente.' : 'Não aplicável (sem site).');
  const q5 = lead.has_website === 1 && websiteAnalysis.speedScore >= 60 ? 'Sim. Carrega em menos de 2s.' : (lead.has_website === 1 ? 'Não. Carregamento lento.' : 'Não aplicável (sem site).');
  const q6 = lead.has_website === 1 && websiteAnalysis.layoutQuality === 'Profissional' ? 'Sim. Layout elegante.' : (lead.has_website === 1 ? 'Não. Visual genérico ou descuidado.' : 'Não aplicável.');
  const q7 = lead.has_website === 0 ? 'Altíssimo. Sem presença web oficial.' : (websiteAnalysis.speedScore < 60 || websiteAnalysis.mobileScore < 50 ? 'Alto. Site atual apresenta falhas graves.' : 'Baixo. Site atual é bom.');
  const q8 = lead.category?.toLowerCase().includes('loja') || lead.category?.toLowerCase().includes('commerce') || lead.segment?.toLowerCase().includes('loja') ? 'Sim ou necessita' : 'Não identificado.';
  const q9 = lead.has_website === 0 || websiteAnalysis.layoutQuality !== 'Profissional' ? 'Sim. Requer nova identidade ou manual de marca.' : 'Não. Aparência adequada.';
  const q10 = socialAnalysis.postFrequency === 'Inativa / Parada' ? 'Sim. Sem atualizações nos últimos 30 dias.' : 'Não. Frequência regular.';
  const q11 = !socialAnalysis.hasWhatsappLink || !websiteAnalysis.hasContactForm ? 'Sim. Oportunidade de automatizar captação.' : 'Baixa. Já possui fluxos básicos.';
  const q12 = !socialAnalysis.hasWhatsappLink ? 'Sim. Chatbot aumentaria conversão na bio.' : 'Pode ser otimizado.';
  const q13 = lead.has_website === 0 ? 'Sim. Landing page focada em vendas é ideal.' : 'Não necessário.';
  const q14 = lead.reviews_count > 10 ? 'Sim. Alta oportunidade para Google Ads Local.' : 'Moderada.';
  const q15 = socialAnalysis.postFrequency !== 'Inativa' ? 'Sim. Meta Ads geraria tráfego qualificado.' : 'Baixa.';
  const q16 = lead.has_website === 1 && (websiteAnalysis.speedScore < 60 || websiteAnalysis.mobileScore < 60) ? 'Sim. Redesign técnico e visual recomendado.' : 'Não.';

  const aiReport = `### 📋 Relatório de Oportunidade - ${lead.name}
- **Nota Geral de Presença Digital:** ${lead.has_website === 0 ? '0/100' : `${Math.round(websiteAnalysis.speedScore * 0.4 + websiteAnalysis.seoScore * 0.6)}/100`}
- **Prioridade de Abordagem:** ${lead.opportunity_score >= 80 ? '🔴 PRIORIDADE ALTA' : (lead.opportunity_score >= 50 ? '🟡 PRIORIDADE MÉDIA' : '🟢 PRIORIDADE BAIXA')}
- **Chance de Conversão:** ${lead.opportunity_score >= 80 ? '85%' : (lead.opportunity_score >= 50 ? '55%' : '25%')}
- **Serviços Recomendados:**
${services.map(s => `- ${s}`).join('\n')}

#### 🔍 Diagnóstico de Presença Digital (Perguntas Decisivas)
1. **Essa empresa possui site?** ${q1}
2. **O site é moderno?** ${q2}
3. **É responsivo?** ${q3}
4. **Tem SEO?** ${q4}
5. **Está rápido?** ${q5}
6. **Tem aparência profissional?** ${q6}
7. **Existe potencial para vender um novo site?** ${q7}
8. **Possui e-commerce?** ${q8}
9. **Tem identidade visual ruim?** ${q9}
10. **As redes sociais estão abandonadas?** ${q10}
11. **Existe oportunidade para automações?** ${q11}
12. **Existe oportunidade para chatbot?** ${q12}
13. **Existe oportunidade para landing page?** ${q13}
14. **Existe oportunidade para Google Ads?** ${q14}
15. **Existe oportunidade para Meta Ads?** ${q15}
16. **Existe oportunidade para redesign?** ${q16}

#### 👍 Pontos Positivos
- Relevância local em ${lead.city}/${lead.state} com porte: ${companySize}.
${lead.rating ? `- Aceitação física consolidada com nota ${lead.rating}★ no Google Maps (${lead.reviews_count} avaliações).` : ''}

#### 👎 Pontos Negativos
${issues.map(iss => `- ${iss}`).join('\n') || '- Nenhuma falha crítica detectada.'}

#### 📈 Análise de Oportunidades & Abordagem Comercial
A empresa **${lead.name}** demonstra excelente aceitação física no mercado local de **${lead.city}**. Contudo, possui deficiências severas na sua estrutura online. A abordagem comercial deve se concentrar em contornar objeções mostrando como um site profissional de alta performance e automações de conversão de WhatsApp fecharão mais vendas e economizarão tempo operacional.`;

  const namePlaceholder = lead.name;
  const firstMessage = `Olá! Vi o trabalho da ${namePlaceholder} em ${lead.city} e vi que têm ótimas avaliações no Google (${lead.rating}★). Notei que não possuem um site otimizado para mobile. Hoje, isso faz com que clientes da região fechem com concorrentes. Nós criamos sites profissionais integrados com agendamento automático. Quer receber um diagnóstico gratuito por WhatsApp?`;

  const prospectingMessages = {
    whatsapp: {
      firstContact: `Olá! Notei que a ${namePlaceholder} em ${lead.city} tem excelentes avaliações no Google (${lead.rating}★), mas não possui um site próprio. Hoje, isso faz com que clientes locais fechem com concorrentes que possuem site. Podemos falar 5 minutinhos para eu te mostrar como capturar esses clientes?`,
      secondContact: `Oi! Passando apenas para saber se conseguiu ler a mensagem anterior sobre a presença digital da ${namePlaceholder}. Preparei um diagnóstico visual rápido de como ficaria o layout do seu novo site. Posso te enviar por aqui?`,
      followUp: `Olá, tudo bem? Sei que a rotina na ${namePlaceholder} é corrida! Apenas para te lembrar que empresas em ${lead.city} que implementaram nosso sistema de Landing Page com Chatbot no WhatsApp viram um aumento de até 40% no agendamento. Podemos marcar um bate-papo rápido esta semana?`,
      lastAttempt: `Olá, para não tomar muito seu tempo, esse será meu último contato. Se em algum momento quiser estruturar o site ou configure automações para a ${namePlaceholder}, basta me chamar. Sucesso nos negócios!`
    },
    email: {
      firstContact: `Assunto: Oportunidades de Presença Digital para a ${namePlaceholder}\n\nOlá,\n\nConheci o trabalho da ${namePlaceholder} em ${lead.city} e vi que vocês têm uma excelente avaliação de ${lead.rating} estrelas no Google Maps.\n\nNo entanto, notei que vocês ainda não possuem um site institucional ou Landing Page. No cenário atual, a ausência de um site próprio faz com que clientes locais que buscam por "${lead.segment}" acabem comprando de concorrentes.\n\nNós desenvolvemos sites modernos, ultra-rápidos e integrados com chatbots no WhatsApp para automatizar os agendamentos.\n\nGostaria de receber um diagnóstico de presença digital gratuito da ${namePlaceholder}?\n\nAtenciosamente,\nAgência de Prospecção Digital`,
      secondContact: `Assunto: Diagnóstico gratuito para a ${namePlaceholder}\n\nOlá,\n\nEstou acompanhando meu e-mail anterior sobre a presença digital da ${namePlaceholder} em ${lead.city}.\n\nSeparei alguns minutos para desenhar um rascunho de como seria um site moderno focado em conversão para o seu negócio. Tem interesse em dar uma olhada?\n\nAbraços.`,
      followUp: `Assunto: Como a ${namePlaceholder} pode atrair mais clientes em ${lead.city}\n\nOlá,\n\nEspero que esteja tendo uma excelente semana.\n\nAlém da falta de site, analisamos os concorrentes do segmento de "${lead.segment}" na sua região e notamos uma oportunidade excelente para vocês se destacarem utilizando anúncios locais no Google e Meta.\n\nPodemos agendar uma chamada rápida de 10 minutos para conversarmos sobre essas melhorias?\n\nLink de agendamento: [Seu Link]`,
      lastAttempt: `Assunto: Última tentativa de contato - ${namePlaceholder}\n\nOlá,\n\nComo não tive retorno, imagino que o momento esteja corrido por aí. Para não lotar sua caixa de entrada, esta será minha última mensagem.\n\nSe no futuro decidir estruturar o site, redes sociais ou automações para a ${namePlaceholder}, conte conosco.\n\nDesejo muito sucesso aos seus negócios!`
    },
    instagram: {
      firstContact: `Olá! Parabéns pelo trabalho na ${namePlaceholder} 👏. Notei que vocês têm ótimas avaliações em ${lead.city}, mas não possuem link direto para site ou WhatsApp na bio. Isso dificulta que novos clientes entrem em contato direto por aqui. Quer receber uma dica de como estruturar isso de forma gratuita?`,
      secondContact: `Oi! Conseguiram ver o direct anterior sobre o link de contato na bio? É uma alteração simples que aumenta muito os agendamentos! Se quiser, posso mandar um exemplo de fluxo de atendimento.`,
      followUp: `Olá! Passando para saber se teriam interesse em criar uma Landing Page moderna para a ${namePlaceholder}. Nosso design se adapta ao celular e transforma seguidores do Instagram em clientes reais. Podemos conversar?`,
      lastAttempt: `Olá! Deixo as portas abertas caso queiram estruturar a presença digital e automatizar o atendimento da ${namePlaceholder} no futuro. Desejo muito sucesso!`
    },
    linkedin: {
      firstContact: `Olá! Acompanho o crescimento de empresas no segmento de ${lead.segment} em ${lead.city}. Gostaria de me conectar e compartilhar um breve estudo de caso que fizemos sobre o impacto de websites corporativos e automações comerciais no setor.`,
      secondContact: `Olá! Passando apenas para complementar nossa mensagem anterior. Identificamos algumas oportunidades técnicas na presença digital da ${lead.name} que poderiam expandir seus resultados na região. Tem interesse em dar uma olhada rápida?`,
      followUp: `Olá, tudo bem? Vi que vocês têm excelente aceitação física no Maps. A criação de um funil digital corporativo estruturado para a ${lead.name} ajudaria a escalar as conversões. Podemos agendar uma conversa rápida de 10 minutos na próxima semana?`,
      lastAttempt: `Olá! Deixo nosso contato corporativo aberto caso queiram reestruturar a presença digital e funil comercial da ${lead.name} no futuro. Muito sucesso!`
    }
  };

  return { aiReport, firstMessage, prospectingMessages };
}

// Fetch API Key helper
async function getApiKey(type) {
  try {
    return await dbService.settings.getSettingByKey(`${type}_api_key`);
  } catch (err) {
    return '';
  }
}

export const generateAiReport = async (lead, websiteAnalysis, socialAnalysis) => {
  const geminiKey = await getApiKey('gemini');
  const openaiKey = await getApiKey('openai');

  // Query CRM conversion statistics dynamically for system historical knowledge learning
  let stats = { totalLeads: 0, closed: 0, segmentsRank: [] };
  try {
    stats = await dbService.leads.getStats();
  } catch (err) {
    console.error('Error fetching stats for AI context:', err.message);
  }

  // Calculate company size locally
  const companySize = lead.reviews_count > 150 || lead.followers > 5000 
    ? 'Grande / Alta Relevância Local' 
    : (lead.reviews_count > 30 || lead.followers > 1000 ? 'Média' : 'Pequena / Microempresa');

  const prompt = `Analise a empresa com base nos dados fornecidos, nas estatísticas históricas do sistema e nas regras de negócio, gerando um diagnóstico de presença digital profissional em formato Markdown e uma régua completa de prospecção multicanais.
  
  Dados da Empresa:
  - Nome: ${lead.name}
  - Segmento: ${lead.segment}
  - Categoria: ${lead.category || 'Não definida'}
  - Cidade/Estado: ${lead.city}/${lead.state}
  - Nota Google Maps: ${lead.rating} (${lead.reviews_count} avaliações)
  - Porte da Empresa (calculado): ${companySize}
  - Tem Site: ${lead.has_website === 1 ? 'Sim' : 'Não'}
  - URL do Site: ${lead.website || 'Nenhum'}
  - Seguidores Instagram: ${lead.followers || 'Desconhecido'}
  
  Dados de Vendas e CRM Atuais:
  - Status no CRM: ${lead.status || 'Novo Lead'}
  - Responsável Comercial: ${lead.owner || 'Não designado'}
  - Notas de CRM: ${lead.notes || 'Nenhuma'}
  - Histórico de contatos prévios: ${JSON.stringify(lead.history || [])}
  
  Conhecimento e Histórico de Conversões do Sistema:
  - Total de Leads capturados: ${stats.totalLeads}
  - Clientes convertidos/fechados: ${stats.closed}
  - Segmentos mais quentes históricos: ${stats.segmentsRank.map(s => `${s.segment} (${s.count} leads)`).join(', ') || 'Nenhum ainda'}
  
  Análise Técnica de Website:
  ${JSON.stringify(websiteAnalysis, null, 2)}
  
  Análise de Redes Sociais:
  ${JSON.stringify(socialAnalysis, null, 2)}
  
  Regras de Negócio e Diretrizes de Venda do Sistema:
  1. Se a empresa não tem site, o foco principal é a venda de Landing Page ou Site Institucional com chatbot de WhatsApp.
  2. Se o site é lento (speedScore < 60), o foco é otimização de velocidade ou redesenho (redesign).
  3. Se o site não é responsivo (mobileScore < 50), enfatizar a perda de clientes mobile.
  4. Se o Instagram está desatualizado ou com poucos seguidores, sugerir gestão de redes sociais e design de posts.
  5. Se falta link de WhatsApp na bio ou no site, propor automação de chatbot.
  6. Se a nota do Maps é boa (> 4.0), usar isso como gancho positivo.
  
  Você deve responder com um JSON exatamente neste formato (com as mensagens altamente personalizadas para esta empresa específica, citando seus dados reais técnicos e do Maps, sem repetir textos de outras mensagens e sendo extremamente persuasivo e amigável):
  {
    "aiReport": "O relatório em Markdown contendo:\\n### 📋 Relatório de Oportunidade - [Nome]\\n- **Nota Geral de Presença Digital:** [0 a 100]/100\\n- **Prioridade de Abordagem:** [Alta/Média/Baixa]\\n- **Chance de Conversão:** [0% a 100%]\\n- **Serviços Recomendados:** [como novo site, tráfego pago, chatbot, etc.]\\n\\n#### 🔍 Diagnóstico de Presença Digital (Perguntas Decisivas)\\n(Insira respostas em formato de texto descritivo respondendo exatamente às 16 perguntas abaixo baseadas nos dados fornecidos):\\n1. **Essa empresa possui site?**\\n2. **O site é moderno?**\\n3. **É responsivo?**\\n4. **Tem SEO?**\\n5. **Está rápido?**\\n6. **Tem aparência profissional?**\\n7. **Existe potencial para vender um novo site?**\\n8. **Possui e-commerce?**\\n9. **Tem identidade visual ruim?**\\n10. **As redes sociais estão abandonadas?**\\n11. **Existe oportunidade para automações?**\\n12. **Existe oportunidade para chatbot?**\\n13. **Existe oportunidade para landing page?**\\n14. **Existe oportunidade para Google Ads?**\\n15. **Existe oportunidade para Meta Ads?**\\n16. **Existe oportunidade para redesign?\\n\\n#### 👍 Pontos Positivos\\n- [Pontos positivos]\\n\\n#### 👎 Pontos Negativos\\n- [Pontos negativos]\\n\\n#### 📈 Análise de Oportunidades & Abordagem Comercial\\n- [Abordagem estratégica comercial com base na cidade, segmento e histórico]",
    "firstMessage": "A primeira mensagem de contato sugerida em português (geralmente WhatsApp).",
    "prospectingMessages": {
      "whatsapp": {
        "firstContact": "Mensagem curta, amigável e direta de abordagem inicial no WhatsApp.",
        "secondContact": "Mensagem lembrando do primeiro contato e reforçando o valor do diagnóstico local.",
        "followUp": "Mensagem focando no potencial de atração de clientes da região para fechar uma chamada de 10 min.",
        "lastAttempt": "Mensagem de encerramento temporário deixando o contato aberto."
      },
      "email": {
        "firstContact": "E-mail completo de apresentação, destacando os pontos fracos do site/redes sociais de forma técnica e prestativa.",
        "secondContact": "E-mail de acompanhamento rápido perguntando se teve tempo de ler o diagnóstico.",
        "followUp": "E-mail de valor, compartilhando um insight rápido de tráfego/SEO local aplicável ao negócio.",
        "lastAttempt": "E-mail de encerramento da tentativa de contato, deixando portas abertas."
      },
      "instagram": {
        "firstContact": "Mensagem Direct curta, elogiando o trabalho da empresa e indicando uma oportunidade de bio/link ou postagens.",
        "secondContact": "Direct rápido de acompanhamento.",
        "followUp": "Direct propondo o envio do diagnóstico em PDF.",
        "lastAttempt": "Último contato via direct."
      },
      "linkedin": {
        "firstContact": "Mensagem profissional de apresentação corporativa no LinkedIn direcionada ao decisor.",
        "secondContact": "Mensagem de follow-up focando em benchmarking setorial e concorrentes.",
        "followUp": "Mensagem compartilhando valor ou insight técnico específico de conversão online.",
        "lastAttempt": "Mensagem de despedida deixando contato de negócios."
      }
    }
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

  // 3. Fallback
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
  - Option A: 50% de entrada e 50% na entrega.
  - Option B: Parcelamento em até 3x sem juros no cartão de crédito.
  - Option C: Desconto de 10% para pagamento à vista no Pix.

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
