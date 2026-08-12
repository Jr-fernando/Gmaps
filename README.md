# AgenticLeads

CRM de prospecção local com captura de empresas, gestão de pipeline, análises de presença digital e automações de follow-up.

## Executar localmente

1. Instale as dependências com `npm run install:all`.
2. Copie `.env.example` para `.env` e configure as variáveis necessárias.
3. Inicie a API com `npm run dev:server` e a interface com `npm run dev:client`.
4. Abra `http://localhost:5173`.

Sem `ADMIN_API_KEY`, o modo local permanece aberto. Em produção, essa variável é obrigatória e a aplicação oferece uma tela de acesso com sessão HTTP-only.

## Qualidade

- `npm run build` compila o cliente.
- `npm run lint --prefix client` executa a análise estática.
- `npm test` executa os testes do servidor.
- `GET /status` confirma disponibilidade do processo.
- `GET /api/health` confirma a conexão com o armazenamento autenticado.

## Produção

Configure `SUPABASE_URL` e `SUPABASE_KEY` para armazenamento persistente. SQLite é indicado apenas para desenvolvimento local; o armazenamento temporário da Vercel não deve ser usado como banco de produção.

Em Vercel, defina `ADMIN_API_KEY`, `CORS_ORIGIN`, `SUPABASE_URL` e `SUPABASE_KEY`. A chave de serviço do Supabase só deve ser utilizada por um backend autenticado e nunca exposta ao cliente.

## Integrações

Google Places, Gemini, OpenAI e webhooks são opcionais. As chaves são armazenadas no servidor e não são retornadas pela API. URLs de webhook precisam ser HTTP(S) públicas; endereços locais e privados são bloqueados.
