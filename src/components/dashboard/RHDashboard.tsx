import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Coins, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Check, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  Building2, 
  UserCheck, 
  ArrowUpDown, 
  Printer, 
  ChevronRight, 
  SlidersHorizontal, 
  DollarSign, 
  Calendar 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, VacationRequest, VacationPayment, Department } from '../../types';
import { storage, calculateVacationFinancials } from '../../services/storageService';
import { HospitalVacationCalendar } from '../calendar/HospitalVacationCalendar';

interface RHDashboardProps {
  currentUser: User;
  onRefresh: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const RHDashboard: React.FC<RHDashboardProps> = ({ 
  currentUser, 
  onRefresh,
  activeTab = 'solicitacoes_gerais'
}) => {
  const [internalTab, setInternalTab] = useState<'solicitacoes' | 'pagamentos' | 'supervisores' | 'calendario'>(
    activeTab === 'calendario_rh' ? 'calendario' : 'solicitacoes'
  );

  useEffect(() => {
    if (activeTab === 'calendario_rh') {
      setInternalTab('calendario');
    } else if (activeTab === 'pagamentos') {
      setInternalTab('pagamentos');
    } else if (activeTab === 'classificacao_equipes') {
      setInternalTab('supervisores');
    } else if (activeTab === 'solicitacoes_gerais') {
      setInternalTab('solicitacoes');
    }
  }, [activeTab]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Receipt Modal State
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<VacationPayment | null>(null);

  // Supervisor Assignment State
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('usr_sup_1');
  const [selectedEmployeeToAssign, setSelectedEmployeeToAssign] = useState<string>('');

  const users = storage.getUsers();
  const allRequests = storage.getRequests();
  const allPayments = storage.getPayments();
  const departments = storage.getDepartments();

  const supervisors = users.filter(u => u.role === 'supervisor' || u.role === 'adm');
  const regularEmployees = users.filter(u => u.role === 'funcionario');

  const selectedSupervisor = users.find(u => u.id === selectedSupervisorId) || supervisors[0];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Filtered requests
  const filteredRequests = allRequests.filter(req => {
    const matchesSearch = req.userName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          req.userDepartment.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          req.userJobTitle.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesDept = selectedDepartment === 'all' || req.userDepartment === selectedDepartment;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Action: Approve & Schedule Payment from RH
  const handleRHApproveAndSchedule = (req: VacationRequest) => {
    const targetUser = users.find(u => u.id === req.userId);
    if (!targetUser) return;

    // Calculate financials
    const fin = calculateVacationFinancials(
      targetUser.baseSalary, 
      req.daysRequested, 
      req.sellTenDays, 
      req.advanceThirteenth, 
      req.startDate
    );

    const payment: VacationPayment = {
      id: 'pay_' + Date.now(),
      vacationRequestId: req.id,
      userId: targetUser.id,
      userName: targetUser.name,
      userDepartment: targetUser.department,
      ...fin,
    };

    storage.addOrUpdatePayment(payment);

    // Update request status to aprovado_rh
    const updatedReq: VacationRequest = {
      ...req,
      status: 'aprovado_rh',
      updatedAt: new Date().toISOString(),
    };
    storage.updateRequest(updatedReq);

    // Notify employee
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: targetUser.id,
      title: 'Férias e Pagamento Agendados pelo RH',
      message: `Suas férias foram homologadas pelo RH. Pagamento líquido de ${formatCurrency(fin.estimatedNetTotal)} agendado para ${formatDate(fin.paymentScheduledDate)}.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    });

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {
      // ignore
    }

    onRefresh();
  };

  // Action: Change Payment Status (e.g. Marcar como Pago)
  const handleMarkPaymentAsPaid = (payment: VacationPayment) => {
    const updatedPayment: VacationPayment = {
      ...payment,
      paymentStatus: 'pago',
      paidAt: new Date().toISOString(),
    };
    storage.addOrUpdatePayment(updatedPayment);

    // Notify employee
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: payment.userId,
      title: 'Pagamento de Férias Efetuado',
      message: `O valor líquido de ${formatCurrency(payment.estimatedNetTotal)} foi creditado em sua conta com recibo nº ${payment.paymentReceiptNumber}.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    });

    onRefresh();
  };

  // Action: Classify/Assign Employee to Supervisor
  const handleAssignEmployee = (employeeId: string, supervisorId: string) => {
    const targetEmp = users.find(u => u.id === employeeId);
    const targetSup = users.find(u => u.id === supervisorId);
    if (!targetEmp || !targetSup) return;

    targetEmp.supervisorId = targetSup.id;
    targetEmp.supervisorName = targetSup.name;
    storage.updateUser(targetEmp);

    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: targetEmp.id,
      title: 'Atualização de Gestão Imediata',
      message: `Seu supervisor responsável por escalas e aprovação de férias foi definido para ${targetSup.name}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    });

    onRefresh();
  };

  // Stats
  const totalApproved = allRequests.filter(r => r.status === 'aprovado_rh').length;
  const pendingRH = allRequests.filter(r => r.status === 'aprovado_supervisor').length;
  const totalPaymentValue = allPayments.reduce((acc, p) => acc + p.estimatedNetTotal, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200">
              Departamento Pessoal & RH
            </span>
            <span className="text-xs text-slate-500 font-mono">
              HeyLife Hospital
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Gestão Integrada de Férias & Folha RH
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestora: <strong className="text-slate-700">{currentUser.name}</strong> · Homologação de solicitações, agendamento legal de pagamentos (CLT Art. 145) e governança de alçadas dos supervisores.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-[11px] text-amber-700 block font-semibold">Aguardando RH</span>
            <span className="text-lg font-bold text-amber-900 font-mono">{pendingRH}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[11px] text-emerald-700 block font-semibold">Homologadas</span>
            <span className="text-lg font-bold text-emerald-900 font-mono">{totalApproved}</span>
          </div>
          <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-center">
            <span className="text-[11px] text-sky-700 block font-semibold">Total em Férias</span>
            <span className="text-sm font-bold text-sky-900 font-mono">{formatCurrency(totalPaymentValue)}</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setInternalTab('solicitacoes')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            internalTab === 'solicitacoes' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Solicitações Gerais ({filteredRequests.length})
        </button>

        <button
          onClick={() => setInternalTab('pagamentos')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            internalTab === 'pagamentos' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          Agendamento de Pagamento ({allPayments.length})
        </button>

        <button
          onClick={() => setInternalTab('supervisores')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            internalTab === 'supervisores' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-600" />
          Classificar Supervisores & Equipes
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
          Calendário Geral & Pagamentos
        </button>
      </div>

      {/* TAB 1: SOLICITAÇÕES GERAIS */}
      {internalTab === 'solicitacoes' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por colaborador, cargo ou setor..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="all">Todos os Status</option>
                  <option value="aprovado_supervisor">Aprovado pelo Supervisor (Aguardando RH)</option>
                  <option value="pendente_supervisor">Pendente do Supervisor</option>
                  <option value="remanejado">Data Remanejada</option>
                  <option value="aprovado_rh">Homologado pelo RH</option>
                  <option value="rejeitado">Recusado</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Unidade:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="all">Todos os Setores</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Colaborador / Setor</th>
                    <th className="px-6 py-3 font-semibold">Supervisor</th>
                    <th className="px-6 py-3 font-semibold">Período de Férias</th>
                    <th className="px-6 py-3 font-semibold">Dias & Benefícios</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Ação RH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{req.userName}</div>
                        <div className="text-[11px] text-slate-500">{req.userJobTitle}</div>
                        <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100 mt-0.5 inline-block">
                          {req.userDepartment}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{req.supervisorName}</div>
                        <span className="text-[10px] text-slate-400">Coordenação imediata</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {formatDate(req.startDate)} a {formatDate(req.endDate)}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Solicitado em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-800">{req.daysRequested} dias</div>
                        <div className="flex flex-col gap-0.5 text-[11px] mt-1">
                          {req.sellTenDays && (
                            <span className="text-emerald-700 font-medium">✓ Abono 10 dias</span>
                          )}
                          {req.advanceThirteenth && (
                            <span className="text-sky-700 font-medium">✓ 1ª parc. 13º</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {req.status === 'pendente_supervisor' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Aguardando Supervisor
                          </span>
                        )}
                        {req.status === 'remanejado' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Data Remanejada
                          </span>
                        )}
                        {req.status === 'aprovado_supervisor' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 animate-pulse">
                            Aprovado Supervisor (Homologar RH)
                          </span>
                        )}
                        {req.status === 'aprovado_rh' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Homologado & Agendado
                          </span>
                        )}
                        {req.status === 'rejeitado' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Recusado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {req.status === 'aprovado_supervisor' ? (
                          <button
                            onClick={() => handleRHApproveAndSchedule(req)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 ml-auto"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            Homologar & Agendar Pagamento
                          </button>
                        ) : req.status === 'aprovado_rh' ? (
                          <span className="text-emerald-700 text-xs font-medium flex items-center gap-1 justify-end">
                            <CheckCircle className="w-4 h-4" />
                            Agendado
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: AGENDAMENTO DE PAGAMENTO DE FÉRIAS */}
      {internalTab === 'pagamentos' && (
        <div className="space-y-4">
          
          {/* CLT Compliance Banner */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <CalendarClock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-950">Conformidade Legal CLT · Artigo 145</h3>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                O pagamento da remuneração das férias e, se for o caso, o do abono pecuniário, deve ser efetuado <strong>até 2 dias antes do início das férias</strong>. O sistema calcula e bloqueia automaticamente a data máxima de depósito para mitigar passivos trabalhistas.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Programação de Pagamento de Férias</h3>
                <p className="text-xs text-slate-500">Valores analíticos, recibos fiscais e liquidação bancária</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {allPayments.length} pagamentos processados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Colaborador / Recibo</th>
                    <th className="px-6 py-3 font-semibold">Salário Base</th>
                    <th className="px-6 py-3 font-semibold">Dias</th>
                    <th className="px-6 py-3 font-semibold">Remuneração + 1/3</th>
                    <th className="px-6 py-3 font-semibold">Abono / 13º</th>
                    <th className="px-6 py-3 font-semibold">Líquido a Pagar</th>
                    <th className="px-6 py-3 font-semibold">Data Limite CLT</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{pay.userName}</div>
                        <span className="text-[11px] text-slate-400 font-mono">{pay.paymentReceiptNumber}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {formatCurrency(pay.baseSalary)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold">
                        {pay.vacationDays} dias
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        <div>{formatCurrency(pay.vacationPay + pay.constitutionalBonus)}</div>
                        <span className="text-[10px] text-slate-400">1/3: {formatCurrency(pay.constitutionalBonus)}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px]">
                        {pay.pecuniaryBonus > 0 && (
                          <div className="text-emerald-700">Abono: +{formatCurrency(pay.pecuniaryBonus)}</div>
                        )}
                        {pay.thirteenthAdvance > 0 && (
                          <div className="text-sky-700">13º: +{formatCurrency(pay.thirteenthAdvance)}</div>
                        )}
                        {!pay.pecuniaryBonus && !pay.thirteenthAdvance && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-emerald-700 text-sm">
                        {formatCurrency(pay.estimatedNetTotal)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{formatDate(pay.paymentScheduledDate)}</div>
                        <span className="text-[10px] text-amber-700">2 dias antes</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {pay.paymentStatus === 'pago' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> Pago
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Agendado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedPaymentForReceipt(pay)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Visualizar Recibo de Férias"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                          </button>

                          {pay.paymentStatus !== 'pago' && (
                            <button
                              onClick={() => handleMarkPaymentAsPaid(pay)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                              title="Marcar como Liquidado no Banco"
                            >
                              Pagar
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

      {/* TAB 3: CLASSIFICAR SUPERVISORES & EQUIPES */}
      {internalTab === 'supervisores' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Governança de Supervisores & Vínculo de Equipes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina e classifique quais supervisores têm alçada de aprovação sobre cada funcionário ou equipe clínica.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Supervisor Selector & Assigned List */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecione o Supervisor Clínico
                  </label>
                  <select
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.role.toUpperCase()} - {sup.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800">
                      Colaboradores Sob Gestão de {selectedSupervisor.name}:
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {users.filter(u => u.supervisorId === selectedSupervisor.id).length} membros
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {users.filter(u => u.supervisorId === selectedSupervisor.id).length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Nenhum colaborador atribuído a este gestor ainda.</p>
                    ) : (
                      users.filter(u => u.supervisorId === selectedSupervisor.id).map(emp => (
                        <div key={emp.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">{emp.name}</span>
                            <p className="text-[11px] text-slate-500">{emp.jobTitle} · {emp.department}</p>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Subordinado
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Assign/Reclassify Employee to Supervisor */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-5 bg-sky-50/60 rounded-xl border border-sky-200">
                  <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider mb-2">
                    Vincular / Reclassificar Colaborador
                  </h4>
                  <p className="text-xs text-sky-900 mb-4">
                    Escolha um colaborador para vincular à alçada de <strong>{selectedSupervisor.name}</strong>.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Escolha o Colaborador
                      </label>
                      <select
                        value={selectedEmployeeToAssign}
                        onChange={(e) => setSelectedEmployeeToAssign(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      >
                        <option value="">Selecione um colaborador da lista...</option>
                        {regularEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.jobTitle} - Atual Gestor: {emp.supervisorName || 'Sem Gestor'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={!selectedEmployeeToAssign}
                      onClick={() => {
                        handleAssignEmployee(selectedEmployeeToAssign, selectedSupervisor.id);
                        setSelectedEmployeeToAssign('');
                      }}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                        selectedEmployeeToAssign
                          ? 'bg-sky-600 hover:bg-sky-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      Confirmar Vínculo de Supervisão
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CALENDÁRIO GERAL & DATAS DE PAGAMENTO */}
      {internalTab === 'calendario' && (
        <div className="space-y-4">
          <HospitalVacationCalendar
            currentUser={currentUser}
            onViewPayment={setSelectedPaymentForReceipt}
            onRefresh={onRefresh}
            forceShowAllDepartments={true}
          />
        </div>
      )}

      {/* Modal: Recibo e Holerite de Férias */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Demonstrativo de Férias (Recibo Oficial)</h3>
                  <p className="text-xs text-slate-400">Recibo: {selectedPaymentForReceipt.paymentReceiptNumber} · HeyLife Hospital</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPaymentForReceipt(null)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              
              {/* Employee Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Colaborador</span>
                  <p className="font-bold text-slate-900">{selectedPaymentForReceipt.userName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Unidade</span>
                  <p className="font-semibold text-slate-800">{selectedPaymentForReceipt.userDepartment}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Dias Utilizados</span>
                  <p className="font-mono font-bold text-slate-800">{selectedPaymentForReceipt.vacationDays} dias</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Data do Crédito</span>
                  <p className="font-bold text-emerald-700">{formatDate(selectedPaymentForReceipt.paymentScheduledDate)}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left">Rubrica de Provento / Desconto</th>
                      <th className="p-3 text-right">Referência</th>
                      <th className="p-3 text-right">Proventos (R$)</th>
                      <th className="p-3 text-right">Descontos (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-3">Remuneração de Férias</td>
                      <td className="p-3 text-right">{selectedPaymentForReceipt.vacationDays} dias</td>
                      <td className="p-3 text-right text-slate-900">{formatCurrency(selectedPaymentForReceipt.vacationPay)}</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">1/3 Constitucional (Art. 7º, XVII CF)</td>
                      <td className="p-3 text-right">33,33%</td>
                      <td className="p-3 text-right text-slate-900">{formatCurrency(selectedPaymentForReceipt.constitutionalBonus)}</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                    </tr>
                    {selectedPaymentForReceipt.pecuniaryBonus > 0 && (
                      <tr>
                        <td className="p-3">Abono Pecuniário (10 dias vendidos + 1/3)</td>
                        <td className="p-3 text-right">10 dias</td>
                        <td className="p-3 text-right text-emerald-700">+{formatCurrency(selectedPaymentForReceipt.pecuniaryBonus)}</td>
                        <td className="p-3 text-right text-slate-400">-</td>
                      </tr>
                    )}
                    {selectedPaymentForReceipt.thirteenthAdvance > 0 && (
                      <tr>
                        <td className="p-3">Adiantamento de 1ª Parcela do 13º Salário</td>
                        <td className="p-3 text-right">50%</td>
                        <td className="p-3 text-right text-sky-700">+{formatCurrency(selectedPaymentForReceipt.thirteenthAdvance)}</td>
                        <td className="p-3 text-right text-slate-400">-</td>
                      </tr>
                    )}
                    <tr>
                      <td className="p-3 text-slate-600">INSS / IRRF Retido na Fonte (Estimado)</td>
                      <td className="p-3 text-right">CLT</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right text-red-600">-{formatCurrency(selectedPaymentForReceipt.estimatedDeductions)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="p-3 text-slate-800">Total Líquido a Receber</td>
                      <td colSpan={2} className="p-3 text-right font-mono text-emerald-700 text-sm">
                        {formatCurrency(selectedPaymentForReceipt.estimatedNetTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Emitido digitalmente pelo RH HeyLife Hospital
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert('Recibo enviado para impressão / download em PDF.');
                    }}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Recibo
                  </button>
                  <button
                    onClick={() => setSelectedPaymentForReceipt(null)}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
