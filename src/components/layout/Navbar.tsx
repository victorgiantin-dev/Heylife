import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  LogOut, 
  Bell, 
  ShieldCheck, 
  Users, 
  CalendarClock, 
  Database,
  BriefcaseMedical,
  ChevronDown
} from 'lucide-react';
import { User, Role } from '../../types';
import { storage } from '../../services/storageService';

interface NavbarProps {
  currentUser: User;
  onSelectRole: (role: Role) => void;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  onLogout,
  activeTab,
  setActiveTab,
  onOpenNotifications,
  unreadCount,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const allUsers = storage.getUsers();
  const supabaseConfig = storage.getSupabaseConfig();

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'adm': return 'Administrador';
      case 'rh': return 'Recursos Humanos';
      case 'supervisor': return 'Supervisor Clínico';
      case 'funcionario': return 'Colaborador';
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'adm': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rh': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'supervisor': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'funcionario': return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Zone 1: Single element brand wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-sky-600 to-emerald-600 flex items-center justify-center text-white shadow-xs">
              <BriefcaseMedical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">Hey<span className="text-sky-600">Life</span></span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">Hospital</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Gestão de Férias & Escala Clínica</p>
            </div>
          </div>

          {/* Zone 2: Navigation Links based on active user permission */}
          <nav className="hidden md:flex items-center gap-1">
            {currentUser.role === 'funcionario' && (
              <>
                <button
                  onClick={() => setActiveTab('minhas_ferias')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'minhas_ferias' 
                      ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Minhas Férias & Saldo
                </button>
                <button
                  onClick={() => setActiveTab('calendario_funcionario')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'calendario_funcionario' 
                      ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Calendário da Unidade
                </button>
                <button
                  onClick={() => setActiveTab('solicitar')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'solicitar' 
                      ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Solicitar Férias
                </button>
              </>
            )}

            {currentUser.role === 'supervisor' && (
              <>
                <button
                  onClick={() => setActiveTab('aprovacoes')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'aprovacoes' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Aprovações & Remanejamento
                </button>
                <button
                  onClick={() => setActiveTab('equipe_escala')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'equipe_escala' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Calendário & Escala da Equipe
                </button>
              </>
            )}

            {currentUser.role === 'rh' && (
              <>
                <button
                  onClick={() => setActiveTab('solicitacoes_gerais')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'solicitacoes_gerais' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Todas Solicitações
                </button>
                <button
                  onClick={() => setActiveTab('pagamentos')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'pagamentos' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Agendamento de Pagamento
                </button>
                <button
                  onClick={() => setActiveTab('calendario_rh')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'calendario_rh' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Calendário & Pagamentos
                </button>
                <button
                  onClick={() => setActiveTab('classificacao_equipes')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'classificacao_equipes' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Supervisores & Equipes
                </button>
              </>
            )}

            {currentUser.role === 'adm' && (
              <>
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'usuarios' 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Usuários & Acessos
                </button>
                <button
                  onClick={() => setActiveTab('calendario_adm')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'calendario_adm' 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Calendário Geral
                </button>
                <button
                  onClick={() => setActiveTab('departamentos')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'departamentos' 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Unidades Clínicas
                </button>
                <button
                  onClick={() => setActiveTab('supabase')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'supabase' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'text-emerald-700 hover:bg-emerald-50/60'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  Conexão Supabase
                  {supabaseConfig.isConnected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions, Notification, User Profile & Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Supabase status pill for ADM */}
            {currentUser.role === 'adm' && (
              <div 
                onClick={() => setActiveTab('supabase')}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors bg-slate-50 hover:bg-slate-100 border-slate-200"
                title="Configuração do Supabase (Apenas Administrador)"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-700">Supabase:</span>
                <span className={supabaseConfig.isConnected ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
                  {supabaseConfig.isConnected ? 'Conectado' : 'Local / Config'}
                </span>
              </div>
            )}

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Notificações do Sistema"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Dropdown / Switch Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-semibold flex items-center justify-center text-xs">
                  {currentUser.avatarInitials || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${getRoleColor(currentUser.role)}`}>
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <p className="text-[11px] text-sky-700 mt-0.5">{currentUser.jobTitle}</p>
                    <p className="text-[10px] text-slate-400">{currentUser.department}</p>
                  </div>

                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Alternar Perfil Clínico (Demonstração)
                    </p>
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          u.id === currentUser.id ? 'bg-sky-50/70 font-semibold' : ''
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="text-slate-800 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.jobTitle}</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap ${getRoleColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 px-2">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Encerrar Sessão
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
