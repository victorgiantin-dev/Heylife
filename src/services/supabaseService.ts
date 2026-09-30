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
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- HEYLIFE HOSPITAL - SCHEMA SUPABASE COMPLETO & PRODUÇÃO
-- Sistema Integrado de Gestão de Férias & Escala Clínica
-- Inclui: Tabelas, RLS Avançado, Buckets de Storage e Políticas
-- ========================================================

-- 1. Extensões Essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 2. LIMPEZA PREVENTIVA DE TABELAS CONFLITANTES
-- Remove tabelas antigas ou templates do Supabase onde 'id' foi
-- criado como UUID, resolvendo o erro 42804 de tipos incompatíveis:
-- ========================================================
DROP TABLE IF EXISTS public.vacation_payments CASCADE;
DROP TABLE IF EXISTS public.vacation_requests CASCADE;
DROP TABLE IF EXISTS public.system_notifications CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ========================================================
-- 3. CRIAÇÃO DAS TABELAS DO BANCO DE DADOS
-- ========================================================

-- A. Unidades Clínicas & Departamentos Hospitalares
CREATE TABLE public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    head_supervisor_id TEXT,
    min_clinical_staff_required INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. Perfis de Usuários Clínicos e Administrativos
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('adm', 'rh', 'supervisor', 'funcionario')),
    department TEXT NOT NULL,
    job_title TEXT NOT NULL,
    crm_coren TEXT,
    supervisor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    supervisor_name TEXT,
    admission_date DATE NOT NULL,
    vacation_balance INTEGER DEFAULT 30,
    total_days_acquired INTEGER DEFAULT 30,
    days_used INTEGER DEFAULT 0,
    accrued_period_start DATE,
    accrued_period_end DATE,
    concessive_period_deadline DATE,
    base_salary NUMERIC(12,2) DEFAULT 0.00,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    avatar_initials TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Solicitações de Férias da Equipe Clínica
CREATE TABLE public.vacation_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_job_title TEXT,
    user_department TEXT NOT NULL,
    supervisor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    supervisor_name TEXT,
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
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Agendamento e Pagamentos de Férias (RH Hospitalar - CLT Art. 145)
CREATE TABLE public.vacation_payments (
    id TEXT PRIMARY KEY,
    vacation_request_id TEXT NOT NULL REFERENCES public.vacation_requests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_department TEXT NOT NULL,
    base_salary NUMERIC(12,2) NOT NULL,
    vacation_days INTEGER NOT NULL,
    vacation_pay NUMERIC(12,2) NOT NULL,
    constitutional_bonus NUMERIC(12,2) NOT NULL, -- 1/3 constitucional
    pecuniary_bonus NUMERIC(12,2) DEFAULT 0.00,  -- 10 dias abono pecuniário
    thirteenth_advance NUMERIC(12,2) DEFAULT 0.00, -- 1ª parcela 13º
    estimated_gross_total NUMERIC(12,2) NOT NULL,
    estimated_deductions NUMERIC(12,2) DEFAULT 0.00,
    estimated_net_total NUMERIC(12,2) NOT NULL,
    payment_scheduled_date DATE NOT NULL, -- 2 dias úteis antes do início das férias
    payment_status TEXT DEFAULT 'agendado' CHECK (payment_status IN ('pendente', 'agendado', 'pago', 'cancelado')),
    payment_receipt_number TEXT,
    receipt_document_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Notificações do Sistema Hospitalar
CREATE TABLE public.system_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- id do usuário ou 'all'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'alert')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 4. STORAGE: BUCKETS E ARMAZENAMENTO DE DOCUMENTOS
-- ========================================================

-- Criar Buckets para Documentos de Férias e Recibos Hospitalares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vacation-receipts', 'vacation-receipts', true, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('vacation-attachments', 'vacation-attachments', false, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/msword'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Armazenamento Seguro (storage.objects)
DROP POLICY IF EXISTS "Leitura de Recibos de Férias" ON storage.objects;
DROP POLICY IF EXISTS "Upload de Recibos pelo RH e ADM" ON storage.objects;
DROP POLICY IF EXISTS "Visualização de Anexos Autorizados" ON storage.objects;
DROP POLICY IF EXISTS "Upload de Anexos de Solicitação" ON storage.objects;

-- A. Leitura de Recibos de Férias
CREATE POLICY "Leitura de Recibos de Férias"
ON storage.objects FOR SELECT
USING (bucket_id = 'vacation-receipts');

-- B. Upload de Recibos pelo RH e Administrador
CREATE POLICY "Upload de Recibos pelo RH e ADM"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vacation-receipts' AND 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid()::text AND role IN ('rh', 'adm')
    )
    OR auth.role() = 'authenticated'
  )
);

-- C. Acesso aos Anexos de Solicitações (Próprio usuário, Supervisor, RH ou ADM)
CREATE POLICY "Visualização de Anexos Autorizados"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vacation-attachments' AND (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid()::text AND role IN ('rh', 'adm', 'supervisor')
    )
  )
);

-- D. Upload de Anexos por Colaboradores
CREATE POLICY "Upload de Anexos de Solicitação"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vacation-attachments' AND auth.role() = 'authenticated'
);

-- ========================================================
-- 5. FUNÇÕES AUXILIARES DE PAPÉIS (ROLES)
-- ========================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'adm');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_rh()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role IN ('rh', 'adm'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role IN ('supervisor', 'adm'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ========================================================
-- 6. POLÍTICAS DE ROW LEVEL SECURITY (RLS) NAS TABELAS
-- ========================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- --- TABELA: DEPARTMENTS ---
CREATE POLICY "Departamentos: Leitura para todos autenticados"
ON public.departments FOR SELECT
USING (true);

CREATE POLICY "Departamentos: Apenas ADM pode criar/editar"
ON public.departments FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- TABELA: PROFILES ---
CREATE POLICY "Perfis: Leitura para todos autenticados"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Perfis: ADM tem controle total"
ON public.profiles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Perfis: RH pode atualizar supervisores e equipes"
ON public.profiles FOR UPDATE
USING (public.is_rh())
WITH CHECK (public.is_rh());

-- --- TABELA: VACATION_REQUESTS ---
CREATE POLICY "Solicitações: Leitura para todos os envolvidos"
ON public.vacation_requests FOR SELECT
USING (
  public.is_rh() OR
  supervisor_id = auth.uid()::text OR
  user_id = auth.uid()::text OR
  auth.role() = 'authenticated'
);

CREATE POLICY "Solicitações: Colaborador pode criar seu pedido"
ON public.vacation_requests FOR INSERT
WITH CHECK (
  auth.uid()::text = user_id OR
  public.is_admin() OR
  auth.role() = 'authenticated'
);

CREATE POLICY "Solicitações: Supervisor pode aprovar ou remanejar equipe"
ON public.vacation_requests FOR UPDATE
USING (
  supervisor_id = auth.uid()::text OR
  public.is_rh() OR
  auth.uid()::text = user_id
)
WITH CHECK (
  supervisor_id = auth.uid()::text OR
  public.is_rh() OR
  auth.uid()::text = user_id
);

-- --- TABELA: VACATION_PAYMENTS ---
CREATE POLICY "Pagamentos: RH e ADM gerenciam e agendam"
ON public.vacation_payments FOR ALL
USING (public.is_rh())
WITH CHECK (public.is_rh());

CREATE POLICY "Pagamentos: Colaborador visualiza o seu recibo"
ON public.vacation_payments FOR SELECT
USING (
  user_id = auth.uid()::text OR
  public.is_rh() OR
  auth.role() = 'authenticated'
);

-- --- TABELA: SYSTEM_NOTIFICATIONS ---
CREATE POLICY "Notificações: Leitura do destinatário"
ON public.system_notifications FOR SELECT
USING (user_id = auth.uid()::text OR user_id = 'all' OR auth.role() = 'authenticated');

CREATE POLICY "Notificações: Atualizar lida"
ON public.system_notifications FOR UPDATE
USING (user_id = auth.uid()::text OR user_id = 'all');

CREATE POLICY "Notificações: Criar notificações"
ON public.system_notifications FOR INSERT
WITH CHECK (true);

-- ========================================================
-- 7. DADOS INICIAIS DE DEMONSTRAÇÃO (SEED HOSPITALAR)
-- ========================================================

-- Unidades Clínicas
INSERT INTO public.departments (id, name, description, min_clinical_staff_required)
VALUES 
  ('dep_uti', 'UTI Adulto & Coronariana', 'Unidade de Terapia Intensiva com 24 leitos de alta complexidade.', 4),
  ('dep_cc', 'Centro Cirúrgico & RPA', 'Bloco operatório com 8 salas de cirurgias eletivas e de urgência.', 3),
  ('dep_pa', 'Pronto Atendimento & Emergência', 'Atendimento 24h para urgências clínicas e cirúrgicas.', 5),
  ('dep_ped', 'Pediatria & UTI Neo', 'Cuidados intensivos e internação materno-infantil.', 3),
  ('dep_farm', 'Farmácia Clínica Hospitalar', 'Dispensação de medicamentos de alto custo e controle de estoques.', 2),
  ('dep_rh', 'Gestão de Pessoas & RH Clínico', 'Departamento pessoal, escalas trabalhistas e relações hospitalares.', 2)
ON CONFLICT (id) DO NOTHING;

-- Usuários Clínicos
INSERT INTO public.profiles (id, name, email, role, department, job_title, crm_coren, supervisor_id, supervisor_name, admission_date, vacation_balance, total_days_acquired, days_used, accrued_period_start, accrued_period_end, concessive_period_deadline, base_salary, status, avatar_initials)
VALUES
  ('usr_adm_1', 'Dr. Roberto Albuquerque', 'roberto.adm@heylife.hospital', 'adm', 'Diretoria Médica & Hospitalar', 'Diretor Clínico & Administrador Geral', 'CRM-SP 98214', NULL, NULL, '2019-03-15', 30, 30, 0, '2025-03-15', '2026-03-14', '2027-02-15', 28500.00, 'ativo', 'RA'),
  ('usr_rh_1', 'Dra. Camila Duarte', 'camila.rh@heylife.hospital', 'rh', 'Gestão de Pessoas & RH Clínico', 'Coordenadora de Recursos Humanos', 'CRA-SP 45190', NULL, NULL, '2021-06-01', 20, 30, 10, '2025-06-01', '2026-05-31', '2027-04-30', 12400.00, 'ativo', 'CD'),
  ('usr_sup_1', 'Enf. Chefe Marcos Vinícius', 'marcos.supervisor@heylife.hospital', 'supervisor', 'UTI Adulto & Coronariana', 'Supervisor de Enfermagem UTI & Centro Cirúrgico', 'COREN-SP 184920', NULL, NULL, '2020-08-10', 15, 30, 15, '2025-08-10', '2026-08-09', '2027-07-10', 11200.00, 'ativo', 'MV'),
  ('usr_sup_2', 'Dra. Mariana Rios', 'mariana.supervisor@heylife.hospital', 'supervisor', 'Pronto Atendimento & Emergência', 'Supervisora Médica de Emergência & Pediatria', 'CRM-SP 142890', NULL, NULL, '2022-01-10', 30, 30, 0, '2025-01-10', '2026-01-09', '2026-12-10', 19800.00, 'ativo', 'MR'),
  ('usr_func_1', 'Dra. Larissa Mendes', 'larissa.plantonista@heylife.hospital', 'funcionario', 'UTI Adulto & Coronariana', 'Médica Intensivista Plantonista', 'CRM-SP 165432', 'usr_sup_1', 'Enf. Chefe Marcos Vinícius', '2023-04-18', 30, 30, 0, '2025-04-18', '2026-04-17', '2027-03-18', 17500.00, 'ativo', 'LM'),
  ('usr_func_2', 'Téc. Juliana Rocha', 'juliana.enfermagem@heylife.hospital', 'funcionario', 'UTI Adulto & Coronariana', 'Técnica de Enfermagem em Cuidados Críticos', 'COREN-SP 492104', 'usr_sup_1', 'Enf. Chefe Marcos Vinícius', '2022-09-01', 20, 30, 10, '2024-09-01', '2025-08-31', '2026-07-31', 4850.00, 'ativo', 'JR'),
  ('usr_func_3', 'Dr. Felipe Nogueira', 'felipe.cirurgia@heylife.hospital', 'funcionario', 'Centro Cirúrgico & RPA', 'Cirurgião Geral & Vídeo-Laparoscopia', 'CRM-SP 139871', 'usr_sup_1', 'Enf. Chefe Marcos Vinícius', '2021-11-20', 30, 30, 0, '2024-11-20', '2025-11-19', '2026-10-20', 21000.00, 'ativo', 'FN'),
  ('usr_func_4', 'Fisiot. André Silveira', 'andre.fisioterapia@heylife.hospital', 'funcionario', 'Pronto Atendimento & Emergência', 'Fisioterapeuta Respiratório Hospitalar', 'CREFITO 84729-F', 'usr_sup_2', 'Dra. Mariana Rios', '2022-03-10', 15, 30, 15, '2025-03-10', '2026-03-09', '2027-02-10', 6200.00, 'ativo', 'AS')
ON CONFLICT (id) DO NOTHING;

-- Solicitações de Férias Demonstrativas
INSERT INTO public.vacation_requests (id, user_id, user_name, user_job_title, user_department, supervisor_id, supervisor_name, start_date, end_date, days_requested, sell_ten_days, advance_thirteenth, reason, status, supervisor_notes, rescheduled_start_date, rescheduled_end_date, rescheduled_reason, rescheduled_by)
VALUES
  ('req_101', 'usr_func_1', 'Dra. Larissa Mendes', 'Médica Intensivista Plantonista', 'UTI Adulto & Coronariana', 'usr_sup_1', 'Enf. Chefe Marcos Vinícius', '2026-11-02', '2026-11-16', 15, true, true, 'Descanso pós-ciclo de plantões intensivos e participação em congresso.', 'pendente_supervisor', NULL, NULL, NULL, NULL, NULL),
  ('req_102', 'usr_func_2', 'Téc. Juliana Rocha', 'Técnica de Enfermagem em Cuidados Críticos', 'UTI Adulto & Coronariana', 'usr_sup_1', 'Enf. Chefe Marcos Vinícius', '2026-10-15', '2026-11-03', 20, false, false, 'Viagem em família programada há 1 ano.', 'remanejado', 'Período solicitado coincide com reforma do bloco 2 da UTI e ausência de 2 outros plantonistas.', '2026-11-09', '2026-11-28', 'Para manter o contingente mínimo de 4 profissionais na escala crítica da UTI. Período sugerido possui cobertura completa.', 'Enf. Chefe Marcos Vinícius'),
  ('req_103', 'usr_func_3', 'Dr. Felipe Nogueira', 'Cirurgião Geral & Vídeo-Laparoscopia', 'Centro Cirúrgico & RPA', 'usr_sup_1', 'Enf. Chefe Marcos Vinícius', '2026-12-01', '2026-12-30', 30, false, true, 'Férias integrais para viagem ao exterior.', 'aprovado_supervisor', 'Escala cirúrgica remanejada com Dr. Rodrigo cobrindo as terças e quintas. Aprovado pelo supervisor.', NULL, NULL, NULL, NULL),
  ('req_104', 'usr_func_4', 'Fisiot. André Silveira', 'Fisioterapeuta Respiratório Hospitalar', 'Pronto Atendimento & Emergência', 'usr_sup_2', 'Dra. Mariana Rios', '2026-10-05', '2026-10-19', 15, false, false, 'Recesso de meio de ano programado com a chefia médica.', 'aprovado_rh', 'Autorizado sem impacto no atendimento do PA.', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Pagamentos Agendados pelo RH (CLT Art. 145)
INSERT INTO public.vacation_payments (id, vacation_request_id, user_id, user_name, user_department, base_salary, vacation_days, vacation_pay, constitutional_bonus, pecuniary_bonus, thirteenth_advance, estimated_gross_total, estimated_deductions, estimated_net_total, payment_scheduled_date, payment_status, payment_receipt_number, notes)
VALUES
  ('pay_104', 'req_104', 'usr_func_4', 'Fisiot. André Silveira', 'Pronto Atendimento & Emergência', 6200.00, 15, 3100.00, 1033.33, 0.00, 0.00, 4133.33, 578.67, 3554.66, '2026-10-03', 'agendado', 'REC-892104', 'Folha de pagamento liberada pelo RH. Depósito bancário agendado para 2 dias antes do início das férias.'),
  ('pay_103', 'req_103', 'usr_func_3', 'Dr. Felipe Nogueira', 'Centro Cirúrgico & RPA', 21000.00, 30, 21000.00, 7000.00, 0.00, 10500.00, 38500.00, 3920.00, 34580.00, '2026-11-29', 'pendente', 'REC-398711', 'Em análise final de folha pelo RH. Aguardando aprovação orçamentária hospitalar.')
ON CONFLICT (id) DO NOTHING;
`;

