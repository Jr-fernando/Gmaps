# LeadMap

Plataforma de prospecção local que transforma empresas encontradas no Google Maps em oportunidades comerciais qualificadas.

## Fluxo do produto

1. Defina o nicho, a cidade e a região.
2. Escolha a oportunidade que você vende: social media, site, automação de WhatsApp ou tráfego pago.
3. Aplique filtros de reputação e presença digital.
4. O sistema captura, audita e prioriza os contatos.
5. Os leads seguem para a base, perfil completo e pipeline comercial.

## Estrutura única

- `client`: interface React/Vite.
- `server`: API, qualificação, IA, persistência e automações.
- `api`: adaptador serverless para a Vercel.

As antigas aplicações paralelas foram descontinuadas. Todo o produto agora utiliza esta raiz, um único backend e um único modelo de dados.

## Desenvolvimento

1. Instale as dependências com `npm run install:all`.
2. Copie `.env.example` para `.env` e configure as variáveis.
3. Execute `npm run dev:server` e `npm run dev:client`.

## Produção

A aplicação usa Vercel para hospedagem e Supabase para persistência. As chaves de Google Places e IA podem ser cadastradas pela tela de configurações depois que o banco estiver conectado.
