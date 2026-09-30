import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  CalendarClock, 
  AlertTriangle, 
  Users, 
  XCircle, 
  Check, 
  ArrowRightLeft, 
  Clock, 
  BriefcaseMedical,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  LayoutGrid
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, VacationRequest } from '../../types';
import { storage } from '../../services/storageService';
import { HospitalVacationCalendar } from '../calendar/HospitalVacationCalendar';

interface SupervisorDashboardProps {
  currentUser: User;
  onRefresh: () => void;
  activeTab?: string;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ 
  currentUser, 
  onRefresh,
  activeTab = 'aprovacoes'
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'aprovacoes' | 'calendario'>(
    activeTab === 'equipe_escala' ? 'calendario' : 'aprovacoes'
  );

  useEffect(() => {
    if (activeTab === 'equipe_escala') {
      setCurrentSubTab('calendario');
    } else if (activeTab === 'aprovacoes') {
      setCurrentSubTab('aprovacoes');
    }
  }, [activeTab]);

  const allUsers = storage.getUsers();
  const allRequests = storage.getRequests();
  const departments = storage.getDepartments();

  // Find team members supervised by this user or in the same clinical units
  const supervisedUsers = allUsers.filter(u => 
    u.supervisorId === currentUser.id || 
    (u.department === currentUser.department && u.role === 'funcionario')
  );

  const supervisedUserIds = new Set(supervisedUsers.map(u => u.id));

  // Team requests
  const teamRequests = allRequests.filter(r => 
    r.supervisorId === currentUser.id || supervisedUserIds.has(r.userId)
  );

  // Remanejar modal state
  const [selectedRequestForReschedule, setSelectedRequestForReschedule] = useState<VacationRequest | null>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [newDays, setNewDays] = useState<number>(30);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  // Reject modal state
  const [selectedRequestForReject, setSelectedRequestForReject] = useState<VacationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Helper date calculation
  const calculateEndDate = (start: string, days: number): string => {
    if (!start) return '';
    const d = new Date(start + 'T00:00:00');
    d.setDate(d.getDate() + (days - 1));
    return d.toISOString().split('T')[0];
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

  // Actions
  const handleApprove = (req: VacationRequest) => {
    const updated: VacationRequest = {
      ...req,
      status: 'aprovado_supervisor',
      supervisorNotes: `Aprovado pelo Supervisor ${currentUser.name} sem conflito de escala clínica.`,
      updatedAt: new Date().toISOString(),
    };

    storage.updateRequest(updated);

    // Notify employee
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: req.userId,
      title: 'Férias Aprovadas pelo Supervisor',
      message: `Seu supervisor ${currentUser.name} aprovou o período de ${formatDate(req.startDate)} a ${formatDate(req.endDate)}. Encaminhado ao RH para agendamento de pagamento.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    });

    // Notify RH
    storage.addNotification({
      id: 'notif_rh_' + Date.now(),
      userId: 'usr_rh_1',
      title: 'Férias Prontas para Pagamento',
      message: `${req.userName} teve suas férias aprovadas pela coordenação. Aguardando agendamento de pagamento.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    });

    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch {
      // ignore
    }

    onRefresh();
  };

  const openRescheduleModal = (req: VacationRequest) => {
    setSelectedRequestForReschedule(req);
    // suggest 15 or 30 days ahead
    const currentStart = new Date(req.startDate + 'T00:00:00');
    currentStart.setDate(currentStart.getDate() + 14);
    setNewStartDate(currentStart.toISOString().split('T')[0]);
    setNewDays(req.daysRequested);
    setRescheduleReason(`Ajuste de escala na unidade ${req.userDepartment} para garantir cobertura segura dos plantões.`);
    setRescheduleError('');
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReschedule) return;

    if (!newStartDate) {
      setRescheduleError('Informe a nova data de início sugerida.');
      return;
    }

    if (!rescheduleReason.trim()) {
      setRescheduleError('Por favor, informe a justificativa clínica do remanejamento para orientar o colaborador.');
      return;
    }

    const calculatedNewEnd = calculateEndDate(newStartDate, newDays);

    const updated: VacationRequest = {
      ...selectedRequestForReschedule,
      status: 'remanejado',
      rescheduledStartDate: newStartDate,
      rescheduledEndDate: calculatedNewEnd,
      rescheduledReason: rescheduleReason,
      rescheduledBy: currentUser.name,
      supervisorNotes: `Data remanejada pelo supervisor devido à escala hospitalar.`,
      updatedAt: new Date().toISOString(),
    };

    storage.updateRequest(updated);

    // Notify employee
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: selectedRequestForReschedule.userId,
      title: 'Proposta de Remanejamento de Férias',
      message: `${currentUser.name} propôs remanejar seu período de férias para ${formatDate(newStartDate)} a ${formatDate(calculatedNewEnd)}. Motivo: ${rescheduleReason}`,
      type: 'warning',
      timestamp: new Date().toISOString(),
      read: false,
    });

    setSelectedRequestForReschedule(null);
    onRefresh();
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReject) return;

    const updated: VacationRequest = {
      ...selectedRequestForReject,
      status: 'rejeitado',
      supervisorNotes: rejectReason || 'Solicitação inviável no período solicitado devido a carência de plantonistas.',
      updatedAt: new Date().toISOString(),
    };

    storage.updateRequest(updated);

    // Refund days to user
    const users = storage.getUsers();
    const targetUser = users.find(u => u.id === selectedRequestForReject.userId);
    if (targetUser) {
      targetUser.vacationBalance = Math.min(30, targetUser.vacationBalance + selectedRequestForReject.daysRequested);
      targetUser.daysUsed = Math.max(0, targetUser.daysUsed - selectedRequestForReject.daysRequested);
      storage.saveUsers(users);
    }

    // Notify employee
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: selectedRequestForReject.userId,
      title: 'Solicitação de Férias Não Aprovada',
      message: `Sua solicitação de férias foi indeferida pelo supervisor. Motivo: ${rejectReason || 'Carência de escala.'}`,
      type: 'alert',
      timestamp: new Date().toISOString(),
      read: false,
    });

    setSelectedRequestForReject(null);
    setRejectReason('');
    onRefresh();
  };

  const pendingCount = teamRequests.filter(r => r.status === 'pendente_supervisor').length;
  const rescheduledCount = teamRequests.filter(r => r.status === 'remanejado').length;
  const approvedCount = teamRequests.filter(r => r.status === 'aprovado_supervisor' || r.status === 'aprovado_rh').length;

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentUser.department}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {currentUser.crmCoren}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Painel da Supervisão Clínica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestor Responsável: <strong className="text-slate-700">{currentUser.name}</strong> · Avalie solicitações, aprove e remaneje períodos para garantir o contingente mínimo assistencial.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-xs text-amber-700 block font-semibold">Pendentes</span>
            <span className="text-lg font-bold text-amber-900 font-mono">{pendingCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-center">
            <span className="text-xs text-purple-700 block font-semibold">Remanejadas</span>
            <span className="text-lg font-bold text-purple-900 font-mono">{rescheduledCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-xs text-emerald-700 block font-semibold">Aprovadas</span>
            <span className="text-lg font-bold text-emerald-900 font-mono">{approvedCount}</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Aprovações vs Calendário Interativo */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setCurrentSubTab('aprovacoes')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            currentSubTab === 'aprovacoes' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Aprovações da Equipe ({teamRequests.length})
        </button>

        <button
          onClick={() => setCurrentSubTab('calendario')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            currentSubTab === 'calendario' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          Calendário & Escala da Equipe
        </button>
      </div>

      {/* VIEW 1: CALENDÁRIO INTERATIVO */}
      {currentSubTab === 'calendario' && (
        <div className="space-y-4">
          <HospitalVacationCalendar
            currentUser={currentUser}
            onRemanejarRequest={openRescheduleModal}
            onRefresh={onRefresh}
            defaultDepartment="equipe"
          />
        </div>
      )}

      {/* VIEW 2: APROVAÇÕES E GESTÃO DE EQUIPE */}
      {currentSubTab === 'aprovacoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left / Main Column: Requests Queue */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Solicitações de Férias da Equipe</h2>
                  <p className="text-xs text-slate-500">Aprovação direta ou proposta de remanejamento de datas</p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  {teamRequests.length} solicitações
                </span>
              </div>

              {teamRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Nenhuma solicitação de férias para a sua equipe no momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {teamRequests.map((req) => (
                    <div key={req.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        
                        {/* Employee Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{req.userName}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs text-slate-600">{req.userJobTitle}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{req.userDepartment}</p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {formatDate(req.startDate)} a {formatDate(req.endDate)} ({req.daysRequested} dias)
                            </span>
                            {req.sellTenDays && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                + Abono 10 dias
                              </span>
                            )}
                            {req.advanceThirteenth && (
                              <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                + Adiant. 13º
                              </span>
                            )}
                          </div>

                          {req.reason && (
                            <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-md border border-slate-100">
                              "{req.reason}"
                            </p>
                          )}

                          {/* Remanejado Details if already suggested */}
                          {req.status === 'remanejado' && (
                            <div className="mt-3 p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-semibold text-purple-900">
                                <CalendarClock className="w-4 h-4 text-purple-600" />
                                <span>Proposta de Remanejamento Enviada ao Colaborador</span>
                              </div>
                              <p className="text-slate-700">
                                Nova data sugerida: <strong>{formatDate(req.rescheduledStartDate)} a {formatDate(req.rescheduledEndDate)}</strong>
                              </p>
                              <p className="text-slate-500 italic">
                                Motivo: {req.rescheduledReason}
                              </p>
                              <span className="text-[10px] text-purple-700 font-medium">Aguardando confirmação do colaborador.</span>
                            </div>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                          <div>
                            {req.status === 'pendente_supervisor' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Pendente Sua Aprovação
                              </span>
                            )}
                            {req.status === 'remanejado' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Data Remanejada
                              </span>
                            )}
                            {req.status === 'aprovado_supervisor' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                Aprovado Supervisor / RH
                              </span>
                            )}
                            {req.status === 'aprovado_rh' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Férias & Pagamento Agendados
                              </span>
                            )}
                            {req.status === 'rejeitado' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                Recusada
                              </span>
                            )}
                          </div>

                          {/* Supervisor Action Buttons (only for pending or remanejado) */}
                          {req.status === 'pendente_supervisor' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(req)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                                title="Aprovar Férias no período solicitado"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Aprovar
                              </button>

                              <button
                                onClick={() => openRescheduleModal(req)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                                title="Remanejar datas devido a escala do plantão"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                Remanejar Datas
                              </button>

                              <button
                                onClick={() => setSelectedRequestForReject(req)}
                                className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                                title="Recusar solicitação"
                              >
                                Recusar
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clinical Team & Staffing Coverage Monitor */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Membros da Minha Equipe</h3>
                  <p className="text-[11px] text-slate-500">Clique para gerenciar ou remanejar férias</p>
                </div>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="mt-4 space-y-3">
                {supervisedUsers.map((member) => {
                  const memberRequest = teamRequests.find(r => r.userId === member.id && r.status !== 'rejeitado');

                  return (
                    <div key={member.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <button
                            onClick={() => {
                              if (memberRequest) {
                                openRescheduleModal(memberRequest);
                              } else {
                                setCurrentSubTab('calendario');
                              }
                            }}
                            className="text-xs font-bold text-slate-800 hover:text-purple-700 hover:underline text-left block"
                            title="Clique para remanejar datas deste colaborador"
                          >
                            {member.name}
                          </button>
                          <p className="text-[11px] text-slate-500">{member.jobTitle}</p>
                          {member.crmCoren && (
                            <span className="text-[10px] text-sky-700 font-mono mt-0.5 block">{member.crmCoren}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 font-mono">{member.vacationBalance}d</span>
                          <p className="text-[10px] text-slate-400">saldo restante</p>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-100">
                        {memberRequest ? (
                          <button
                            onClick={() => openRescheduleModal(memberRequest)}
                            className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Remanejar ({memberRequest.daysRequested}d)</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-medium">Escala ativa</span>
                        )}
                        <span>Prazo: {formatDate(member.concessivePeriodDeadline)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hospital Shift Safety Notice */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Regra de Contingente Seguro</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                O regulamento do HeyLife Hospital determina manter no mínimo <strong>4 profissionais por turno</strong> na UTI Adulto e <strong>3 no Centro Cirúrgico</strong>. Ao remanejar datas, garanta que não haja coincidência de mais de 2 profissionais de férias no mesmo setor.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Modal: Remanejar Datas de Férias */}
      {selectedRequestForReschedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Remanejar Período de Férias</h3>
                <p className="text-xs text-purple-200">
                  Colaborador: {selectedRequestForReschedule.userName} ({selectedRequestForReschedule.userJobTitle})
                </p>
              </div>
              <button
                onClick={() => setSelectedRequestForReschedule(null)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="p-6 space-y-4">
              
              {/* Original Period */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400">Período originalmente solicitado:</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">
                  {formatDate(selectedRequestForReschedule.startDate)} a {formatDate(selectedRequestForReschedule.endDate)} ({selectedRequestForReschedule.daysRequested} dias)
                </p>
              </div>

              {/* Proposed New Start Date and Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nova Data de Início Proposta
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade de Dias
                  </label>
                  <input
                    type="number"
                    value={newDays}
                    onChange={(e) => setNewDays(Number(e.target.value))}
                    min={5}
                    max={30}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Término previsto: {newStartDate ? formatDate(calculateEndDate(newStartDate, newDays)) : '-'}
                  </p>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificativa Clínica do Remanejamento *
                </label>
                <textarea
                  rows={3}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="ex: Cobertura mínima de escala na UTI devido a cirurgias de alta complexidade programadas para a segunda quinzena..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Essa justificativa será exibida no painel do colaborador para ciência e aceite.
                </p>
              </div>

              {rescheduleError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {rescheduleError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReschedule(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Enviar Proposta de Remanejamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Recusar Solicitação */}
      {selectedRequestForReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Recusar Solicitação de Férias</h3>
              <button
                onClick={() => setSelectedRequestForReject(null)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Você está recusando o período de férias de <strong>{selectedRequestForReject.userName}</strong> ({formatDate(selectedRequestForReject.startDate)} a {formatDate(selectedRequestForReject.endDate)}). Os dias serão estornados ao saldo do colaborador.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo da Recusa *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Informe o motivo formal da recusa para constar no prontuário do colaborador..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReject(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Confirmar Recusa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
