import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Database, 
  ShieldCheck, 
  Building2, 
  Users, 
  Check, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  KeyRound, 
  Link, 
  FileCode2, 
  Lock, 
  Search,
  Download,
  Upload,
  BriefcaseMedical,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Role, Department, SupabaseConfig } from '../../types';
import { storage } from '../../services/storageService';
import { testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '../../services/supabaseService';
import { HospitalVacationCalendar } from '../calendar/HospitalVacationCalendar';

interface AdminDashboardProps {
  currentUser: User;
  onRefresh: () => void;
  activeTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, 
  onRefresh,
  activeTab = 'usuarios'
}) => {
  const [internalTab, setInternalTab] = useState<'usuarios' | 'supabase' | 'departamentos' | 'calendario'>(
    activeTab === 'calendario_adm' ? 'calendario' : activeTab === 'supabase' ? 'supabase' : 'usuarios'
  );

  useEffect(() => {
    if (activeTab === 'calendario_adm') {
      setInternalTab('calendario');
    } else if (activeTab === 'supabase') {
      setInternalTab('supabase');
    } else if (activeTab === 'departamentos') {
      setInternalTab('departamentos');
    } else if (activeTab === 'usuarios') {
      setInternalTab('usuarios');
    }
  }, [activeTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // New/Edit User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // User Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('funcionario');
  const [department, setDepartment] = useState('UTI Adulto & Coronariana');
  const [jobTitle, setJobTitle] = useState('');
  const [crmCoren, setCrmCoren] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('2024-01-10');
  const [vacationBalance, setVacationBalance] = useState<number>(30);
  const [baseSalary, setBaseSalary] = useState<number>(6500);
  const [userFormError, setUserFormError] = useState('');

  // Supabase Config Form
  const currentSupabase = storage.getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentSupabase.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentSupabase.anonKey);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(
    currentSupabase.isConnected ? { success: true, message: 'Supabase conectado com sucesso.' } : null
  );
  const [copiedSql, setCopiedSql] = useState(false);

  // New Department Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptMinStaff, setDeptMinStaff] = useState<number>(3);

  const users = storage.getUsers();
  const departments = storage.getDepartments();
  const supervisors = users.filter(u => u.role === 'supervisor' || u.role === 'adm');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case 'adm': return 'Administrador';
      case 'rh': return 'Recursos Humanos';
      case 'supervisor': return 'Supervisor Clínico';
      case 'funcionario': return 'Colaborador';
    }
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'adm': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rh': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'supervisor': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'funcionario': return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('funcionario');
    setDepartment(departments[0]?.name || 'UTI Adulto & Coronariana');
    setJobTitle('Médico Plantonista');
    setCrmCoren('');
    setSupervisorId(supervisors[0]?.id || '');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setVacationBalance(30);
    setBaseSalary(8500);
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setDepartment(u.department);
    setJobTitle(u.jobTitle);
    setCrmCoren(u.crmCoren || '');
    setSupervisorId(u.supervisorId || '');
    setAdmissionDate(u.admissionDate);
    setVacationBalance(u.vacationBalance);
    setBaseSalary(u.baseSalary);
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    if (!name.trim() || !email.trim() || !jobTitle.trim()) {
      setUserFormError('Nome, e-mail e cargo são obrigatórios.');
      return;
    }

    const assignedSup = supervisors.find(s => s.id === supervisorId);

    // Calculate accrued period
    const startObj = new Date(admissionDate + 'T00:00:00');
    const endObj = new Date(startObj);
    endObj.setFullYear(startObj.getFullYear() + 1);
    endObj.setDate(endObj.getDate() - 1);

    const deadlineObj = new Date(endObj);
    deadlineObj.setFullYear(endObj.getFullYear() + 1);

    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name,
        email,
        role,
        department,
        jobTitle,
        crmCoren,
        supervisorId: assignedSup ? assignedSup.id : null,
        supervisorName: assignedSup ? assignedSup.name : null,
        admissionDate,
        vacationBalance,
        baseSalary,
        avatarInitials: initials,
      };
      storage.updateUser(updated);
    } else {
      const newUser: User = {
        id: 'usr_' + Date.now(),
        name,
        email,
        role,
        department,
        jobTitle,
        crmCoren,
        supervisorId: assignedSup ? assignedSup.id : null,
        supervisorName: assignedSup ? assignedSup.name : null,
        admissionDate,
        vacationBalance,
        totalDaysAcquired: 30,
        daysUsed: 30 - vacationBalance,
        accruedPeriodStart: admissionDate,
        accruedPeriodEnd: endObj.toISOString().split('T')[0],
        concessivePeriodDeadline: deadlineObj.toISOString().split('T')[0],
        baseSalary,
        status: 'ativo',
        avatarInitials: initials,
      };
      storage.addUser(newUser);
    }

    try {
      confetti({ particleCount: 40, spread: 60 });
    } catch {
      // ignore
    }

    setShowUserModal(false);
    onRefresh();
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('Você não pode excluir o usuário administrador atualmente em uso.');
      return;
    }
    if (confirm('Tem certeza que deseja desativar/remover este colaborador do sistema?')) {
      storage.deleteUser(userId);
      onRefresh();
    }
  };

  // Supabase Testing and Saving
  const handleTestAndSaveSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);

    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(false);
    setSupabaseTestResult(res);

    const updatedConfig: SupabaseConfig = {
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      isConnected: res.success,
      syncEnabled: res.success,
      lastTestedAt: new Date().toISOString(),
      errorMessage: res.success ? undefined : res.message,
    };

    storage.saveSupabaseConfig(updatedConfig);
    onRefresh();

    if (res.success) {
      try {
        confetti({ particleCount: 50, spread: 70 });
      } catch {
        // ignore
      }
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;

    const newDep: Department = {
      id: 'dep_' + Date.now(),
      name: deptName,
      description: deptDesc || 'Unidade de saúde do hospital.',
      minClinicalStaffRequired: deptMinStaff || 3,
    };

    const currentDeps = storage.getDepartments();
    currentDeps.push(newDep);
    storage.saveDepartments(currentDeps);

    setShowDeptModal(false);
    setDeptName('');
    setDeptDesc('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200">
              Diretoria Médica & Gestão do Sistema
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Acesso Restrito ao Administrador
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Painel Geral do Administrador
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrador: <strong className="text-slate-700">{currentUser.name}</strong> · Controle exclusivo para cadastrar e classificar usuários, gerenciar unidades clínicas e configurar a conexão com o Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenCreateUser}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Novo Usuário
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setInternalTab('usuarios')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            internalTab === 'usuarios' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Usuários & Permissões ({users.length})
        </button>

        <button
          onClick={() => setInternalTab('supabase')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            internalTab === 'supabase' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          Configuração Supabase
          {currentSupabase.isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>

        <button
          onClick={() => setInternalTab('departamentos')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            internalTab === 'departamentos' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Unidades Clínicas ({departments.length})
        </button>

        <button
          onClick={() => setInternalTab('calendario')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            internalTab === 'calendario' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          Calendário Geral
        </button>
      </div>

      {/* TAB 1: USUÁRIOS & CLASSIFICAÇÃO */}
      {internalTab === 'usuarios' && (
        <div className="space-y-4">
          
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuário por nome, e-mail, cargo ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Classificar Perfil:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="all">Todos os Perfis ({users.length})</option>
                <option value="adm">Administradores</option>
                <option value="rh">Recursos Humanos</option>
                <option value="supervisor">Supervisores Clínicos</option>
                <option value="funcionario">Colaboradores</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Usuário / E-mail</th>
                    <th className="px-6 py-3 font-semibold">Perfil / Alçada</th>
                    <th className="px-6 py-3 font-semibold">Unidade Hospitalar</th>
                    <th className="px-6 py-3 font-semibold">Supervisor Imediato</th>
                    <th className="px-6 py-3 font-semibold">Saldo de Férias</th>
                    <th className="px-6 py-3 font-semibold">Salário Base</th>
                    <th className="px-6 py-3 font-semibold text-right">Ações ADM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                            {u.avatarInitials || u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                            {u.crmCoren && (
                              <span className="text-[10px] text-sky-700 font-mono">{u.crmCoren}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getRoleBadge(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{u.jobTitle}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-800 font-medium">{u.department}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.supervisorName ? (
                          <div className="text-slate-800 font-medium">{u.supervisorName}</div>
                        ) : (
                          <span className="text-slate-400 italic">Diretoria Geral</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-emerald-700">
                        {u.vacationBalance} dias
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Utilizados: {u.daysUsed}d
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(u.baseSalary)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Editar Dados e Classificação"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remover Usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CONFIGURAÇÃO & CONEXÃO SUPABASE (SOMENTE ADM) */}
      {internalTab === 'supabase' && (
        <div className="space-y-6">
          
          {/* Security Banner: Strictly for ADM */}
          <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-950">
                  Painel de Banco de Dados Supabase (Exclusivo para Administrador)
                </h3>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Área Restrita ADM
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Conforme solicitado, somente o usuário com perfil de Administrador tem permissão para visualizar, testar e configurar as credenciais do Supabase. O sistema mantém redundância com cache persistente local de alta performance, garantindo que o hospital nunca pare mesmo sem sinal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form: Credentials & Live Connection Tester */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Credenciais do Projeto Supabase</h4>
                  <p className="text-xs text-slate-500">Insira a URL e a Anon/Public API Key do seu dashboard Supabase</p>
                </div>
                <Database className="w-5 h-5 text-emerald-600" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project URL (Supabase)
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzabcdefg.supabase.co"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Encontrado no painel do Supabase: Project Settings &rarr; API &rarr; Project URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anon / Public API Key
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Chave segura anônima cliente (Project Settings &rarr; API &rarr; Project API Keys &rarr; anon public)
                </p>
              </div>

              {/* Status or Result Message */}
              {supabaseTestResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  supabaseTestResult.success 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {supabaseTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">
                      {supabaseTestResult.success ? 'Conexão Estabelecida' : 'Aviso de Conexão'}
                    </span>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{supabaseTestResult.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status Atual: <strong className={currentSupabase.isConnected ? 'text-emerald-600' : 'text-slate-600'}>
                    {currentSupabase.isConnected ? '● Conectado ao Supabase' : '○ Armazenamento Local Seguro'}
                  </strong>
                </span>

                <button
                  onClick={handleTestAndSaveSupabase}
                  disabled={isTestingSupabase}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  {isTestingSupabase ? 'Testando Conexão...' : 'Testar & Salvar Conexão'}
                </button>
              </div>

              {/* Reset to Local Storage Option */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Deseja resetar os dados hospitalares de demonstração?</span>
                <button
                  onClick={() => {
                    if (confirm('Deseja restaurar os dados originais de demonstração do hospital?')) {
                      storage.resetAllToDefaults();
                      onRefresh();
                    }
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
                >
                  Restaurar Dados Padrão
                </button>
              </div>

            </div>

            {/* Right: SQL Script & Instructions */}
            <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Script DDL PostgreSQL / Supabase</h4>
                      <p className="text-[11px] text-slate-400">Tabelas profiles, requests, payments e departments</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-white transition-colors flex items-center gap-1.5"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 bg-slate-950 rounded-xl p-3 border border-slate-800/80 font-mono text-[11px] text-emerald-300 max-h-72 overflow-y-auto leading-relaxed">
                  <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200">Como aplicar no Supabase:</span>
                <p>1. Acesse o console do seu projeto no Supabase (supabase.com).</p>
                <p>2. Clique em <strong>SQL Editor</strong> na barra lateral esquerda.</p>
                <p>3. Clique em <strong>New Query</strong>, cole o script acima e clique em <strong>Run</strong>.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: UNIDADES CLÍNICAS */}
      {internalTab === 'departamentos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Unidades Clínicas & Setores Hospitalares</h3>
                <p className="text-xs text-slate-500">Definição dos contingentes mínimos de plantão para proteger a assistência</p>
              </div>
              <button
                onClick={() => setShowDeptModal(true)}
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                Nova Unidade Clínica
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const count = users.filter(u => u.department === dept.name).length;

                return (
                  <div key={dept.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{dept.name}</h4>
                      <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                        {count} profissionais
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{dept.description}</p>
                    
                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Contingente Mínimo de Plantão:</span>
                      <span className="font-bold text-slate-800 font-mono">{dept.minClinicalStaffRequired} profissionais</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CALENDÁRIO GERAL HOSPITALAR */}
      {internalTab === 'calendario' && (
        <div className="space-y-4">
          <HospitalVacationCalendar
            currentUser={currentUser}
            onRefresh={onRefresh}
            forceShowAllDepartments={true}
          />
        </div>
      )}

      {/* Modal: Cadastrar ou Editar Usuário */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingUser ? 'Editar Usuário & Classificação' : 'Cadastrar Novo Usuário Clínico'}
                </h3>
                <p className="text-xs text-purple-200">HeyLife Hospital · Controle Administrativo</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Dr. Carlos Eduardo"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos.eduardo@heylife.hospital"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perfil / Alçada de Acesso *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="funcionario">Colaborador Clínico / Geral</option>
                    <option value="supervisor">Supervisor Clínico (Aprova & Remaneja)</option>
                    <option value="rh">Recursos Humanos (Pagamentos & Equipes)</option>
                    <option value="adm">Administrador (Acesso Total & Supabase)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade Hospitalar / Setor
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Especialidade Clínica *
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="ex: Médico Intensivista / Enf. Especialista"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registro Profissional (CRM/COREN/CRF)
                  </label>
                  <input
                    type="text"
                    value={crmCoren}
                    onChange={(e) => setCrmCoren(e.target.value)}
                    placeholder="ex: CRM-SP 123456"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supervisor Imediato
                  </label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="">Nenhum (Diretoria)</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Saldo de Férias (Dias)
                  </label>
                  <input
                    type="number"
                    value={vacationBalance}
                    onChange={(e) => setVacationBalance(Number(e.target.value))}
                    min={0}
                    max={60}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Salário Base Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Admissão
                </label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              {userFormError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {userFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Usuário
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Unidade Clínica */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Cadastrar Unidade Clínica</h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Unidade *
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="ex: Hemodiálise & Nefrologia"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Setor
                </label>
                <textarea
                  rows={2}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Finalidade assistencial do setor..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contingente Mínimo de Plantão (Profissionais)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={deptMinStaff}
                  onChange={(e) => setDeptMinStaff(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Criar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
