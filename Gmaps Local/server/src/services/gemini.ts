import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';

interface CompanyForAnalysis {
  name: string;
  category?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  address?: string | null;
  city?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
}

const SYSTEM_PROMPT = `Você é um consultor de negócios especializado em análise de empresas para prospecção comercial.

REGRAS OBRIGATÓRIAS:
1. Analise APENAS os dados fornecidos. NUNCA invente informações.
2. Se um dado não está disponível, diga "não disponível" em vez de inventar.
3. Seja objetivo, prático e direto.
4. Responda SEMPRE em português brasileiro.
5. A mensagem de prospecção deve ser profissional, personalizada e curta (máximo 3 parágrafos).

Responda EXCLUSIVAMENTE no formato JSON abaixo, sem markdown, sem texto adicional:
{
  "score": <número de 0 a 100>,
  "summary": "<resumo da empresa em 2-3 frases>",
  "problems": ["<problema 1>", "<problema 2>"],
  "opportunities": ["<oportunidade 1>", "<oportunidade 2>"],
  "recommendedServices": ["<serviço 1>", "<serviço 2>"],
  "priority": "<alta|media|baixa>",
  "prospectMessage": "<mensagem personalizada para prospecção>"
}`;

export async function analyzeCompany(
  company: CompanyForAnalysis,
  apiKey: string,
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const companyInfo = `
DADOS DA EMPRESA:
- Nome: ${company.name}
- Categoria: ${company.category || 'Não informada'}
- Telefone: ${company.phone || 'Não informado'}
- Website: ${company.website || 'Não informado'}
- Instagram: ${company.instagram || 'Não informado'}
- Endereço: ${company.address || 'Não informado'}
- Cidade: ${company.city || 'Não informada'}
- Avaliação Google: ${company.rating !== null && company.rating !== undefined ? `${company.rating}/5` : 'Não informada'}
- Total de avaliações: ${company.totalReviews !== null && company.totalReviews !== undefined ? company.totalReviews : 'Não informado'}

Analise esta empresa e forneça sua avaliação no formato JSON especificado.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: companyInfo }] }],
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as AnalysisResult;

    // Validate essential fields
    if (typeof parsed.score !== 'number' || !parsed.summary || !parsed.priority) {
      throw new Error('Resposta da IA incompleta');
    }

    return {
      score: Math.min(100, Math.max(0, parsed.score)),
      summary: parsed.summary,
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      recommendedServices: Array.isArray(parsed.recommendedServices) ? parsed.recommendedServices : [],
      priority: ['alta', 'media', 'baixa'].includes(parsed.priority) ? parsed.priority : 'media',
      prospectMessage: parsed.prospectMessage || '',
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('[Gemini Error]', error);
    throw new AppError(502, 'Erro ao analisar empresa com IA. Tente novamente.');
  }
}
