import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Coins, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Info,
  CalendarCheck,
  CalendarClock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, VacationRequest, VacationPayment } from '../../types';
import { storage, calculateVacationFinancials } from '../../services/storageService';
import { HospitalVacationCalendar } from '../calendar/HospitalVacationCalendar';

interface EmployeeDashboardProps {
  currentUser: User;
  onRefresh: () => void;
  initialOpenModal?: boolean;
  activeTab?: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  currentUser, 
  onRefresh,
  initialOpenModal = false,
  activeTab
}) => {
  const [showRequestModal, setShowRequestModal] = useState(initialOpenModal);
  const [viewSubTab, setViewSubTab] = useState<'painel' | 'calendario'>(
    activeTab === 'calendario_funcionario' ? 'calendario' : 'painel'
  );

  useEffect(() => {
    if (activeTab === 'calendario_funcionario') {
      setViewSubTab('calendario');
    } else if (activeTab === 'minhas_ferias') {
      setViewSubTab('painel');
    } else if (activeTab === 'solicitar') {
      setShowRequestModal(true);
    }
  }, [activeTab]);
  
  // Form states
  const [startDate, setStartDate] = useState('');
  const [daysRequested, setDaysRequested] = useState<number>(30);
  const [sellTenDays, setSellTenDays] = useState(false);
  const [advanceThirteenth, setAdvanceThirteenth] = useState(false);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch updated data
  const allRequests = storage.getRequests();
  const myRequests = allRequests.filter(r => r.userId === currentUser.id);
  const allPayments = storage.getPayments();
  const users = storage.getUsers();
  const freshUser = users.find(u => u.id === currentUser.id) || currentUser;

  // Real-time calculation of end date
  const calculateEndDate = (start: string, days: number): string => {
    if (!start) return '';
    const d = new Date(start + 'T00:00:00');
    d.setDate(d.getDate() + (days - 1));
    return d.toISOString().split('T')[0];
  };

  const endDate = calculateEndDate(startDate, daysRequested);

  // Financial preview
  const financials = startDate 
    ? calculateVacationFinancials(freshUser.baseSalary, daysRequested, sellTenDays, advanceThirteenth, startDate)
    : null;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!startDate) {
      setFormError('Selecione a data de início desejada.');
      return;
    }

    if (daysRequested <= 0 || daysRequested > freshUser.vacationBalance) {
      setFormError(`Quantidade inválida. Seu saldo disponível é de ${freshUser.vacationBalance} dias.`);
      return;
    }

    // CLT checks
    if (sellTenDays && daysRequested > 20) {
      setFormError('Ao optar pelo abono pecuniário (venda de 10 dias), o período máximo de férias é de 20 dias.');
      return;
    }

    const calculatedEnd = calculateEndDate(startDate, daysRequested);

    const newRequest: VacationRequest = {
      id: 'req_' + Date.now(),
      userId: freshUser.id,
      userName: freshUser.name,
      userJobTitle: freshUser.jobTitle,
      userDepartment: freshUser.department,
      supervisorId: freshUser.supervisorId || 'usr_sup_1',
      supervisorName: freshUser.supervisorName || 'Enf. Chefe Marcos Vinícius',
      startDate,
      endDate: calculatedEnd,
      daysRequested,
      sellTenDays,
      advanceThirteenth,
      reason: reason || 'Descanso anual regulamentar.',
      status: 'pendente_supervisor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.addRequest(newRequest);

    // Notify Supervisor
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: freshUser.supervisorId || 'usr_sup_1',
      title: 'Nova Solicitação de Férias',
      message: `${freshUser.name} (${freshUser.jobTitle}) solicitou ${daysRequested} dias a partir de ${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    setShowRequestModal(false);
    setStartDate('');
    setReason('');
    onRefresh();
  };

  const handleAcceptReschedule = (request: VacationRequest) => {
    if (!request.rescheduledStartDate || !request.rescheduledEndDate) return;

    const updated: VacationRequest = {
      ...request,
      startDate: request.rescheduledStartDate,
      endDate: request.rescheduledEndDate,
      status: 'aprovado_supervisor', // Aceitou a data do supervisor, agora vai para o RH
      supervisorNotes: (request.supervisorNotes || '') + ' [Colaborador aceitou a data remanejada proposta pelo supervisor].',
      updatedAt: new Date().toISOString(),
    };

    storage.updateRequest(updated);

    // Notify RH
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: 'usr_rh_1',
      title: 'Férias Aprovadas e Remanejadas',
      message: `${request.userName} aceitou o período remanejado (${new Date(request.rescheduledStartDate + 'T00:00:00').toLocaleDateString('pt-BR')}). Pronto para agendamento de pagamento.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    });

    onRefresh();
  };

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

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome with quick stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-sky-50 text-sky-700 border border-sky-200">
              {freshUser.department}
            </span>
            {freshUser.crmCoren && (
              <span className="text-xs text-slate-500 font-mono">
                {freshUser.crmCoren}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Olá, {freshUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe seu saldo de férias, datas do período aquisitivo e faça solicitações com validação imediata da escala.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={freshUser.vacationBalance <= 0}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-xs transition-colors ${
              freshUser.vacationBalance > 0
                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Solicitar Férias</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Saldo & Solicitações vs Calendário Interativo */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setViewSubTab('painel')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            viewSubTab === 'painel' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
          Meu Saldo & Solicitações
        </button>

        <button
          onClick={() => setViewSubTab('calendario')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            viewSubTab === 'calendario' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          Calendário & Escala da Unidade
        </button>
      </div>

      {/* VIEW 1: CALENDÁRIO DA UNIDADE & ESCALA */}
      {viewSubTab === 'calendario' && (
        <div className="space-y-4">
          <HospitalVacationCalendar
            currentUser={freshUser}
            onRefresh={onRefresh}
            onRequestVacationOnDate={(date) => {
              setStartDate(date);
              setShowRequestModal(true);
            }}
            defaultDepartment={freshUser.department}
          />
        </div>
      )}

      {/* VIEW 2: PAINEL DE SALDO E HISTÓRICO */}
      {viewSubTab === 'painel' && (
        <>
          {/* Saldo de Férias & Períodos Regulamentares Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Saldo Restante */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Saldo Restante
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-600 font-mono tabular-nums">
                  {freshUser.vacationBalance}
                </span>
                <span className="text-xs text-slate-500 font-medium">dias disponíveis</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(freshUser.vacationBalance / (freshUser.totalDaysAcquired || 30)) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                De um total adquirido de {freshUser.totalDaysAcquired || 30} dias
              </p>
            </div>

            {/* Card 2: Dias Já Utilizados */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dias Utilizados
                </span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-800 font-mono tabular-nums">
                  {freshUser.daysUsed}
                </span>
                <span className="text-xs text-slate-500 font-medium">dias no período</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                Histórico registrado pelo RH clínico
              </p>
            </div>

            {/* Card 3: Período Aquisitivo Atual */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Período Aquisitivo
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-800">
                {formatDate(freshUser.accruedPeriodStart)} a {formatDate(freshUser.accruedPeriodEnd)}
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Ciclo de 12 meses de trabalho para aquisição do direito
              </p>
            </div>

            {/* Card 4: Prazo Limite Concessivo (CLT) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Limite Concessivo
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-sm font-bold text-amber-700">
                Até {formatDate(freshUser.concessivePeriodDeadline)}
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Prazo legal para usufruto integral antes da incidência de dobra (CLT)
              </p>
            </div>

          </div>

          {/* Solicitações Remanejadas (Destaque para ação rápida do funcionário) */}
          {myRequests.some(r => r.status === 'remanejado') && (
            <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-amber-900">
                    Atenção: Seu Supervisor Propôs uma Nova Data para Suas Férias
                  </h2>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Para manter a segurança assistencial e a cobertura mínima da escala na sua unidade clínica, foi indicada uma data alternativa.
                  </p>

                  {myRequests.filter(r => r.status === 'remanejado').map(req => (
                    <div key={req.id} className="mt-3 bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[11px] text-slate-400">Período originalmente solicitado:</span>
                          <p className="text-xs font-semibold text-slate-700">
                            {formatDate(req.startDate)} a {formatDate(req.endDate)} ({req.daysRequested} dias)
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-[11px] font-semibold text-emerald-700">Nova data proposta pelo supervisor:</span>
                          <p className="text-sm font-bold text-emerald-600">
                            {formatDate(req.rescheduledStartDate)} a {formatDate(req.rescheduledEndDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-800">Justificativa do Supervisor ({req.rescheduledBy || req.supervisorName}):</span>
                        <p className="mt-0.5 italic">{req.rescheduledReason || req.supervisorNotes || 'Ajuste de escala clínica.'}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAcceptReschedule(req)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aceitar Nova Data Proposta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tabela / Lista de Solicitações do Colaborador */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Minhas Solicitações de Férias</h2>
                <p className="text-xs text-slate-500">Histórico de solicitações, status de aprovação e agendamento financeiro</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {myRequests.length} registros
              </span>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">Nenhuma solicitação de férias cadastrada</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Você possui {freshUser.vacationBalance} dias disponíveis para agendamento. Clique no botão acima para iniciar seu pedido.
                </p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition-colors"
                >
                  Criar Primeira Solicitação
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Período de Férias</th>
                      <th className="px-6 py-3 font-semibold">Dias</th>
                      <th className="px-6 py-3 font-semibold">Benefícios Solicitados</th>
                      <th className="px-6 py-3 font-semibold">Supervisor Responsável</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Acompanhamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myRequests.map((req) => {
                      const paymentInfo = allPayments.find(p => p.vacationRequestId === req.id);

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">
                              {formatDate(req.startDate)} a {formatDate(req.endDate)}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Solicitado em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums font-bold text-slate-800">
                            {req.daysRequested} dias
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {req.sellTenDays ? (
                                <span className="text-emerald-700 font-medium">✓ Abono Pecuniário (10 dias)</span>
                              ) : (
                                <span className="text-slate-400">Sem abono</span>
                              )}
                              {req.advanceThirteenth && (
                                <span className="text-sky-700 font-medium">✓ Adiantamento 1ª parc. 13º</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-slate-800 font-medium">{req.supervisorName}</div>
                            <span className="text-[11px] text-slate-400">Coordenação Clínica</span>
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
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                Aprovado Supervisor / Em análise RH
                              </span>
                            )}
                            {req.status === 'aprovado_rh' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Aprovado & Agendado pelo RH
                              </span>
                            )}
                            {req.status === 'rejeitado' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                Recusado
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {paymentInfo ? (
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Crédito Previsto:</span>
                                <div className="font-semibold text-emerald-700 font-mono">
                                  {formatCurrency(paymentInfo.estimatedNetTotal)}
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  Em {formatDate(paymentInfo.paymentScheduledDate)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Em processamento</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Nova Solicitação de Férias */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-sky-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Solicitar Período de Férias</h3>
                <p className="text-xs text-sky-100">HeyLife Hospital · Departamento: {freshUser.department}</p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              
              {/* Supervisor Info Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Supervisor Imediato Responsável:</span>
                  <p className="font-semibold text-slate-800">{freshUser.supervisorName || 'Enf. Chefe Marcos Vinícius'}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Saldo Restante:</span>
                  <p className="font-bold text-emerald-600 font-mono">{freshUser.vacationBalance} dias</p>
                </div>
              </div>

              {/* Data de Início e Quantidade de Dias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Início das Férias
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Conforme CLT, evite iniciar em dias de repouso</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dias de Férias a Usufruir
                  </label>
                  <select
                    value={daysRequested}
                    onChange={(e) => setDaysRequested(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {[30, 20, 15, 10, 5].filter(d => d <= freshUser.vacationBalance).map(d => (
                      <option key={d} value={d}>{d} dias de férias</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Retorno previsto: {endDate ? formatDate(endDate) : '-'}
                  </p>
                </div>
              </div>

              {/* Benefícios: Abono Pecuniário e 13º */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Opções Adicionais da CLT
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={sellTenDays}
                    onChange={(e) => {
                      setSellTenDays(e.target.checked);
                      if (e.target.checked && daysRequested > 20) {
                        setDaysRequested(20);
                      }
                    }}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Abono Pecuniário (Venda de 10 dias)</span>
                    <p className="text-[11px] text-slate-500">
                      Converte 10 dias de férias em remuneração financeira sem incidência de INSS/IRRF.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={advanceThirteenth}
                    onChange={(e) => setAdvanceThirteenth(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Adiantamento da 1ª Parcela do 13º Salário</span>
                    <p className="text-[11px] text-slate-500">
                      Receba 50% do seu salário base adiantado junto com as férias.
                    </p>
                  </div>
                </label>
              </div>

              {/* Estimativa Financeira em Tempo Real */}
              {financials && (
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-sky-900">
                    <span>Estimativa de Recebimento Líquido:</span>
                    <span className="text-base text-emerald-700 font-mono">
                      {formatCurrency(financials.estimatedNetTotal)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex justify-between">
                    <span>Salário proporcional ({daysRequested} dias) + 1/3:</span>
                    <span className="font-mono">{formatCurrency(financials.vacationPay + financials.constitutionalBonus)}</span>
                  </div>
                  {financials.pecuniaryBonus > 0 && (
                    <div className="text-[11px] text-emerald-700 flex justify-between">
                      <span>Abono Pecuniário (10 dias):</span>
                      <span className="font-mono">+{formatCurrency(financials.pecuniaryBonus)}</span>
                    </div>
                  )}
                  {financials.thirteenthAdvance > 0 && (
                    <div className="text-[11px] text-sky-800 flex justify-between">
                      <span>Adiantamento do 13º (50%):</span>
                      <span className="font-mono">+{formatCurrency(financials.thirteenthAdvance)}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-amber-800 pt-1 border-t border-sky-200/60 flex items-center justify-between">
                    <span>Data legal de pagamento pelo RH:</span>
                    <span className="font-semibold">{formatDate(financials.paymentScheduledDate)} (2 dias úteis antes)</span>
                  </div>
                </div>
              )}

              {/* Justificativa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Justificativa Clínica (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ex: Participação em congresso de cardiologia / recesso familiar..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar Solicitação ao Supervisor
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
