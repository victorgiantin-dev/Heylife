import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';
import { storage } from './storageService';

let activeSupabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = storage.getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    activeSupabaseClient = null;
    return null;
  }

  if (!activeSupabaseClient) {
    try {
      activeSupabaseClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (e) {
      console.error('Failed to instantiate Supabase client:', e);
      return null;
    }
  }

  return activeSupabaseClient;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Anon Key do Supabase são obrigatórios.' };
  }

  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    // Test health or basic endpoint
    const { error } = await testClient.from('profiles').select('count', { count: 'exact', head: true });
    
    // If table doesn't exist yet (404/PGRST204/PGRST205), it still proves the connection and API Key are valid!
    if (error && error.code !== 'PGRST204' && error.code !== 'PGRST205' && error.code !== '42P01') {
      if (error.message.includes('FetchError') || error.message.includes('Failed to fetch') || error.message.includes('Invalid API key')) {
        return { success: false, message: `Erro ao conectar: ${error.message}` };
      }
    }

    return { 
      success: true, 
      message: 'Conexão com o Supabase estabelecida com sucesso! API e credenciais validadas.' 
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Falha na requisição: ${errMessage}` };
  }
}

// SQL Schema for the user to copy/paste into Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- HEYLIFE HOSPITAL - SCHEMA SUPABASE DDL
-- Sistema de Solicitação e Gestão de Férias
-- ==========================================

-- 1. Tabela de Departamentos e Unidades Clínicas
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    head_supervisor_id TEXT,
    min_clinical_staff_required INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Perfis de Usuários (ADM, RH, SUPERVISOR, FUNCIONARIO)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('adm', 'rh', 'supervisor', 'funcionario')),
    department TEXT NOT NULL,
    job_title TEXT NOT NULL,
    crm_coren TEXT,
    supervisor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    admission_date DATE NOT NULL,
    vacation_balance INTEGER DEFAULT 30,
    total_days_acquired INTEGER DEFAULT 30,
    days_used INTEGER DEFAULT 0,
    accrued_period_start DATE,
    accrued_period_end DATE,
    concessive_period_deadline DATE,
    base_salary NUMERIC(12,2) DEFAULT 0.00,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Solicitações de Férias
CREATE TABLE IF NOT EXISTS public.vacation_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    supervisor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    sell_ten_days BOOLEAN DEFAULT false,
    advance_thirteenth BOOLEAN DEFAULT false,
    reason TEXT,
    status TEXT DEFAULT 'pendente_supervisor' CHECK (status IN (
      'pendente_supervisor', 
      'remanejado', 
      'aprovado_supervisor', 
      'aprovado_rh', 
      'rejeitado', 
      'concluido'
    )),
    supervisor_notes TEXT,
    rescheduled_start_date DATE,
    rescheduled_end_date DATE,
    rescheduled_reason TEXT,
    rescheduled_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Agendamento e Pagamentos de Férias (RH Hospitalar)
CREATE TABLE IF NOT EXISTS public.vacation_payments (
    id TEXT PRIMARY KEY,
    vacation_request_id TEXT NOT NULL REFERENCES public.vacation_requests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    base_salary NUMERIC(12,2) NOT NULL,
    vacation_days INTEGER NOT NULL,
    vacation_pay NUMERIC(12,2) NOT NULL,
    constitutional_bonus NUMERIC(12,2) NOT NULL, -- 1/3 constitucional
    pecuniary_bonus NUMERIC(12,2) DEFAULT 0.00, -- 10 dias abono
    thirteenth_advance NUMERIC(12,2) DEFAULT 0.00, -- 1ª parcela 13º
    estimated_gross_total NUMERIC(12,2) NOT NULL,
    estimated_deductions NUMERIC(12,2) DEFAULT 0.00,
    estimated_net_total NUMERIC(12,2) NOT NULL,
    payment_scheduled_date DATE NOT NULL, -- 2 dias antes do início das férias
    payment_status TEXT DEFAULT 'agendado' CHECK (payment_status IN ('pendente', 'agendado', 'pago', 'cancelado')),
    payment_receipt_number TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública/Autenticada para o Dashboard
CREATE POLICY "Leitura departamentos" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Leitura perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Leitura solicitações" ON public.vacation_requests FOR SELECT USING (true);
CREATE POLICY "Leitura pagamentos" ON public.vacation_payments FOR SELECT USING (true);
`;
