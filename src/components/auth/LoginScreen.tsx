import React, { useState } from 'react';
import { 
  BriefcaseMedical, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  UserCheck, 
  Hospital,
  Stethoscope,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { User, Role } from '../../types';
import { storage } from '../../services/storageService';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const users = storage.getUsers();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Por favor, informe o e-mail de acesso corporativo.');
      return;
    }

    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
      onLoginSuccess(found);
    } else {
      setErrorMessage('E-mail não localizado na base hospitalar. Utilize um dos acessos rápidos abaixo.');
    }
  };

  const handleQuickLogin = (targetUser: User) => {
    onLoginSuccess(targetUser);
  };

  // Group quick access users by key roles
  const admUser = users.find(u => u.role === 'adm') || users[0];
  const rhUser = users.find(u => u.role === 'rh') || users[1];
  const supUser = users.find(u => u.role === 'supervisor') || users[2];
  const funcUser1 = users.find(u => u.id === 'usr_func_1') || users[4]; // Dra. Larissa (normal)
  const funcUser2 = users.find(u => u.id === 'usr_func_2') || users[5]; // Juliana (remanejado)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* Left Side: Hospital Branding, Hero & Trust */}
        <div className="lg:col-span-5 bg-linear-to-b from-sky-900 via-sky-800 to-emerald-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300">
                <BriefcaseMedical className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight">Hey<span className="text-emerald-400">Life</span></span>
                <p className="text-xs text-sky-200">Hospital Geral & Especialidades</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Sistema Integrado de Férias & Escala Clínica
              </h2>
              <p className="text-sm text-sky-100 leading-relaxed">
                Plataforma de alta produtividade para coordenação médica, RH hospitalar e conformidade das equipes de saúde.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-sky-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gestão por alçadas: ADM, RH, Supervisores e Colaboradores</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-sky-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Agendamento legal de pagamentos (CLT Art. 145)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-sky-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Remanejamento com proteção do contingente de plantão</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-sky-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Banco de dados integrado ao Supabase (exclusivo ADM)</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 mt-6 flex items-center justify-between text-[11px] text-sky-200">
            <span>HeyLife Clinical OS v2.4</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Conexão Hospitalar Segura
            </span>
          </div>

          {/* Background subtle gradient pattern */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Right Side: Login Form & Quick Role Selectors */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-5">
              <h1 className="text-xl font-bold text-slate-900">Portal do Colaborador & Gestão</h1>
              <p className="text-xs text-slate-500 mt-1">
                Acesse com seu e-mail corporativo ou utilize a seleção rápida abaixo para explorar as funções do sistema.
              </p>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleManualLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: roberto.adm@heylife.hospital"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Senha de Acesso
                  </label>
                  <span className="text-[11px] text-slate-400">Qualquer senha para demonstração</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Role Selector */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Acesso Rápido por Perfil (1 Clique)
                </span>
                <span className="text-[11px] text-slate-400">Pronto para testar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* 1. ADM */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(admUser)}
                  className="p-3 text-left border border-purple-200 hover:border-purple-300 bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      ADMINISTRADOR
                    </span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-medium">ADM</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 mt-1 truncate">{admUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Configura Supabase & cadastra usuários</p>
                </button>

                {/* 2. RH */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(rhUser)}
                  className="p-3 text-left border border-amber-200 hover:border-amber-300 bg-amber-50/50 hover:bg-amber-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <CalendarCheck2 className="w-3.5 h-3.5 text-amber-600" />
                      RECURSOS HUMANOS
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">RH</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 mt-1 truncate">{rhUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Pagamentos & classificação de equipes</p>
                </button>

                {/* 3. SUPERVISOR */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(supUser)}
                  className="p-3 text-left border border-emerald-200 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      SUPERVISOR CLÍNICO
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-medium">SUPERVISOR</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 mt-1 truncate">{supUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Aprova & remaneja datas da UTI</p>
                </button>

                {/* 4. FUNCIONÁRIO (Plantonista) */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(funcUser1)}
                  className="p-3 text-left border border-sky-200 hover:border-sky-300 bg-sky-50/50 hover:bg-sky-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                      COLABORADOR CLÍNICO
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-medium">MÉDICA</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 mt-1 truncate">{funcUser1.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Solicita dias & consulta saldo restante</p>
                </button>

              </div>

              {/* Extra quick button for Juliana who has a remanejado request */}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin(funcUser2)}
                  className="w-full p-2.5 text-left border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="font-semibold text-slate-700">{funcUser2.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">Técnica UTI (Possui solicitação remanejada para avaliar)</span>
                  </div>
                  <span className="text-sky-600 font-medium hover:underline text-[11px]">Entrar &rarr;</span>
                </button>
              </div>

            </div>

          </div>

          <div className="mt-6 pt-3 text-center text-[11px] text-slate-400">
            Hospital HeyLife © 2026 · Todos os direitos reservados · Conformidade com as Leis Trabalhistas e LGPD
          </div>

        </div>

      </div>
    </div>
  );
};
