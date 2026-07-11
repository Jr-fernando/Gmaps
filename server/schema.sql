-- Schema SQL para o Supabase (AgenticLeads SaaS)

-- Habilitar extensão UUID caso necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    segment TEXT,
    category TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    facebook TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    rating REAL,
    reviews_count INTEGER,
    followers INTEGER,
    description TEXT,
    gmaps_link TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT DEFAULT 'Novo Lead',
    opportunity_score INTEGER DEFAULT 0,
    has_website INTEGER DEFAULT 0,
    website_analysis JSONB,
    social_analysis JSONB,
    ai_report TEXT,
    first_message TEXT,
    owner TEXT, -- Responsável do CRM
    value_negotiated REAL DEFAULT 0, -- Valor negociado
    next_action TEXT, -- Próxima ação comercial
    notes TEXT, -- Observações do CRM
    schedule TEXT, -- Horário de funcionamento
    reviews JSONB, -- Avaliações (JSON Array)
    gallery JSONB, -- Galeria de fotos (JSON Array)
    first_contact_date TIMESTAMP WITH TIME ZONE, -- Data do primeiro contato
    last_contact_date TIMESTAMP WITH TIME ZONE, -- Último contato
    history JSONB, -- Histórico de interações (JSON Array)
    proposal_text TEXT, -- Proposta enviada
    proposal_sent BOOLEAN DEFAULT FALSE, -- Flag de proposta enviada
    labels JSONB DEFAULT '[]', -- Etiquetas (JSON Array)
    probability INTEGER DEFAULT 50, -- Probabilidade de conversão (0-100)
    next_contact_date TIMESTAMP WITH TIME ZONE, -- Data do próximo contato
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_name_city UNIQUE (name, city)
);

-- Criar tabela de follow-ups
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sequence_day INTEGER,
    message TEXT,
    status TEXT DEFAULT 'Agendado',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de configurações (Key-Value)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhoria de performance em consultas frequentes
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_segment ON leads(segment);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_opportunity_score ON leads(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status_scheduled ON follow_ups(status, scheduled_for);
