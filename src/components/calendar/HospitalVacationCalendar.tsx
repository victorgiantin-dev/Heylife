import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRightLeft, 
  Filter, 
  Building2, 
  Info,
  CalendarCheck,
  Eye,
  Plus
} from 'lucide-react';
import { User, VacationRequest, VacationPayment } from '../../types';
import { storage } from '../../services/storageService';

interface HospitalVacationCalendarProps {
  currentUser: User;
  onRemanejarRequest?: (request: VacationRequest) => void;
  onViewPayment?: (payment: VacationPayment) => void;
  onRequestVacationOnDate?: (startDate: string) => void;
  onRefresh: () => void;
  defaultDepartment?: string;
  forceShowAllDepartments?: boolean;
}

export const HospitalVacationCalendar: React.FC<HospitalVacationCalendarProps> = ({
  currentUser,
  onRemanejarRequest,
  onViewPayment,
  onRequestVacationOnDate,
  onRefresh,
  defaultDepartment,
  forceShowAllDepartments = false,
}) => {
  // Reference date: start in October 2026 (where test seed requests are scheduled)
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date(2026, 9, 1); // Outubro 2026 (month index 9 = October)
  });

  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [departmentFilter, setDepartmentFilter] = useState<string>(
    defaultDepartment || (forceShowAllDepartments || currentUser.role === 'rh' || currentUser.role === 'adm' ? 'all' : currentUser.department)
  );
  const [showPayments, setShowPayments] = useState<boolean>(currentUser.role === 'rh' || currentUser.role === 'adm');
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ dateStr: string; requests: VacationRequest[]; payments: VacationPayment[] } | null>(null);

  const allUsers = storage.getUsers();
  const allRequests = storage.getRequests();
  const allPayments = storage.getPayments();
  const departments = storage.getDepartments();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date(2026, 9, 1)); // Back to simulated October 2026
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentMonthLabel = `${monthNames[month]} de ${year}`;

  // Filter requests based on role and selected department
  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      // Exclude rejected
      if (req.status === 'rejeitado') return false;

      // Filter by department
      if (departmentFilter !== 'all' && req.userDepartment !== departmentFilter) {
        return false;
      }

      // If regular employee, show all in department or their own
      if (currentUser.role === 'funcionario' && departmentFilter === 'minhas') {
        return req.userId === currentUser.id;
      }

      // If supervisor, can filter by team
      if (currentUser.role === 'supervisor' && departmentFilter === 'equipe') {
        return req.supervisorId === currentUser.id;
      }

      return true;
    });
  }, [allRequests, departmentFilter, currentUser]);

  // Payments matching filter
  const filteredPayments = useMemo(() => {
    if (!showPayments) return [];
    return allPayments.filter(pay => {
      if (departmentFilter !== 'all' && pay.userDepartment !== departmentFilter) {
        return false;
      }
      if (currentUser.role === 'funcionario' && pay.userId !== currentUser.id) {
        return false;
      }
      return true;
    });
  }, [allPayments, showPayments, departmentFilter, currentUser]);

  // Calendar Grid Math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Helper to test if a request active on a specific YYYY-MM-DD
  const getRequestsForDate = (dateStr: string) => {
    return filteredRequests.filter(req => {
      // If rescheduled, test rescheduled period or primary period
      const effectiveStart = req.rescheduledStartDate || req.startDate;
      const effectiveEnd = req.rescheduledEndDate || req.endDate;
      return dateStr >= effectiveStart && dateStr <= effectiveEnd;
    });
  };

  // Helper to test if payment is scheduled on this YYYY-MM-DD
  const getPaymentsForDate = (dateStr: string) => {
    if (!showPayments) return [];
    return filteredPayments.filter(pay => pay.paymentScheduledDate === dateStr);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Format Date String
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Status Badge Colors for Vacations
  const getStatusStyle = (status: VacationRequest['status']) => {
    switch (status) {
      case 'aprovado_rh':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200';
      case 'aprovado_supervisor':
        return 'bg-sky-100 text-sky-900 border-sky-300 hover:bg-sky-200';
      case 'remanejado':
        return 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200';
      case 'pendente_supervisor':
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200';
    }
  };

  // Build grid cells
  const gridCells = useMemo(() => {
    const cells = [];

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        requests: getRequestsForDate(dateStr),
        payments: getPaymentsForDate(dateStr),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        requests: getRequestsForDate(dateStr),
        payments: getPaymentsForDate(dateStr),
      });
    }

    // Next month leading days to complete 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        requests: getRequestsForDate(dateStr),
        payments: getPaymentsForDate(dateStr),
      });
    }

    return cells;
  }, [year, month, filteredRequests, filteredPayments, firstDayOfMonth, daysInMonth, daysInPrevMonth]);

  // Timeline data: list of relevant staff members for the current filter
  const timelineUsers = useMemo(() => {
    let list = allUsers.filter(u => u.role === 'funcionario');
    if (departmentFilter !== 'all' && departmentFilter !== 'equipe' && departmentFilter !== 'minhas') {
      list = list.filter(u => u.department === departmentFilter);
    } else if (departmentFilter === 'equipe' && currentUser.role === 'supervisor') {
      list = list.filter(u => u.supervisorId === currentUser.id || u.department === currentUser.department);
    } else if (departmentFilter === 'minhas') {
      list = list.filter(u => u.id === currentUser.id);
    }
    return list;
  }, [allUsers, departmentFilter, currentUser]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      
      {/* Top Calendar Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
        
        {/* Navigation & Current Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleGoToToday}
              className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Mês Base
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-sky-600" />
              <span>{currentMonthLabel}</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Escala visual de férias & datas de crédito financeiro
            </p>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Department Selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              {(currentUser.role === 'rh' || currentUser.role === 'adm') && (
                <option value="all">Todas as Unidades Hospitalares</option>
              )}
              {currentUser.role === 'supervisor' && (
                <>
                  <option value="equipe">Minha Equipe Sob Supervisão</option>
                  <option value="all">Todas as Unidades</option>
                </>
              )}
              {currentUser.role === 'funcionario' && (
                <>
                  <option value={currentUser.department}>Minha Unidade ({currentUser.department})</option>
                  <option value="minhas">Apenas Minhas Férias</option>
                </>
              )}
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Toggle Payments (RH & ADM) */}
          {(currentUser.role === 'rh' || currentUser.role === 'adm' || currentUser.role === 'funcionario') && (
            <button
              onClick={() => setShowPayments(!showPayments)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showPayments 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Exibir datas limites de depósito (CLT Art. 145)"
            >
              <DollarSign className={`w-3.5 h-3.5 ${showPayments ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Datas de Pagamento</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grade Mensal
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'timeline' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Escala da Equipe
            </button>
          </div>

        </div>

      </div>

      {/* Role Tip / Action Hint Banner */}
      <div className="px-5 py-2.5 bg-sky-50/60 border-b border-sky-100 flex flex-wrap items-center justify-between text-xs text-sky-950 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          {currentUser.role === 'supervisor' && (
            <span>
              <strong>Dica para Supervisores:</strong> Clique diretamente no nome do colaborador ou na barra de férias no calendário para <strong>remanejar datas</strong> e ajustar a escala assistencial.
            </span>
          )}
          {currentUser.role === 'rh' && (
            <span>
              <strong>Visão RH:</strong> Acompanhe todas as férias homologadas e as datas fixadas de pagamento (2 dias antes do início do descanso, conforme Art. 145 CLT).
            </span>
          )}
          {currentUser.role === 'funcionario' && (
            <span>
              <strong>Organização da Sua Agenda:</strong> Visualize os períodos de férias da equipe para planejar seu descanso sem sobrecarregar sua unidade clínica.
            </span>
          )}
          {currentUser.role === 'adm' && (
            <span>
              <strong>Gestão Hospitalar:</strong> Panorama completo de afastamentos programados em todas as enfermarias e unidades de terapia intensiva.
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Aprovado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Remanejado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Em Análise
          </span>
          {showPayments && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-1 ring-emerald-300"></span> 💰 Depósito RH
            </span>
          )}
        </div>
      </div>

      {/* MODE 1: GRADE MENSAL (MONTH GRID) */}
      {viewMode === 'grid' && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center text-xs font-semibold text-slate-600 py-2.5">
              <span>Domingo</span>
              <span>Segunda</span>
              <span>Terça</span>
              <span>Quarta</span>
              <span>Quinta</span>
              <span>Sexta</span>
              <span>Sábado</span>
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
              {gridCells.map((cell, idx) => {
                const isToday = cell.dateStr === '2026-09-30';
                const hasEvents = cell.requests.length > 0 || cell.payments.length > 0;

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-colors group ${
                      !cell.isCurrentMonth 
                        ? 'bg-slate-50/50 text-slate-400' 
                        : isToday 
                        ? 'bg-sky-50/30' 
                        : 'bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        isToday 
                          ? 'bg-sky-600 text-white' 
                          : cell.isCurrentMonth 
                          ? 'text-slate-800' 
                          : 'text-slate-400'
                      }`}>
                        {cell.dayNum}
                      </span>

                      {/* Quick request action for employee on empty day */}
                      {cell.isCurrentMonth && currentUser.role === 'funcionario' && onRequestVacationOnDate && (
                        <button
                          onClick={() => onRequestVacationOnDate(cell.dateStr)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-sky-600 hover:bg-sky-100 rounded text-[10px] transition-all flex items-center gap-0.5"
                          title="Solicitar férias a partir deste dia"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}

                      {/* Details trigger if multiple events */}
                      {hasEvents && (
                        <button
                          onClick={() => setSelectedDayDetails({ dateStr: cell.dateStr, requests: cell.requests, payments: cell.payments })}
                          className="text-[10px] text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ver detalhes do dia"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Day Events Stack */}
                    <div className="space-y-1 overflow-hidden flex-1">
                      
                      {/* Vacation Request Badges */}
                      {cell.requests.slice(0, 2).map(req => {
                        const isRescheduled = req.status === 'remanejado';
                        const isTeamMember = currentUser.role === 'supervisor' && (req.supervisorId === currentUser.id || req.userDepartment === currentUser.department);

                        return (
                          <div
                            key={req.id}
                            onClick={() => {
                              if (isTeamMember && onRemanejarRequest) {
                                onRemanejarRequest(req);
                              } else {
                                setSelectedDayDetails({ dateStr: cell.dateStr, requests: cell.requests, payments: cell.payments });
                              }
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer truncate transition-all flex items-center justify-between gap-1 shadow-2xs ${getStatusStyle(req.status)}`}
                            title={`${req.userName} (${req.userDepartment}) - Clique para detalhes ou remanejamento`}
                          >
                            <span className="truncate">
                              {req.userName.split(' ')[0]} {req.userName.split(' ')[1] || ''}
                            </span>
                            {isRescheduled && (
                              <ArrowRightLeft className="w-3 h-3 text-purple-700 shrink-0" />
                            )}
                          </div>
                        );
                      })}

                      {/* Payment Due Date Alerts (RH & Employee) */}
                      {cell.payments.map(pay => (
                        <div
                          key={pay.id}
                          onClick={() => {
                            if (onViewPayment) {
                              onViewPayment(pay);
                            } else {
                              setSelectedDayDetails({ dateStr: cell.dateStr, requests: cell.requests, payments: cell.payments });
                            }
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer truncate flex items-center gap-1 transition-all"
                          title={`Pagamento de férias: ${pay.userName} (${formatCurrency(pay.estimatedNetTotal)})`}
                        >
                          <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            Pgto: {pay.userName.split(' ')[0]} ({formatCurrency(pay.estimatedNetTotal)})
                          </span>
                        </div>
                      ))}

                      {/* Overflow indicator */}
                      {cell.requests.length > 2 && (
                        <button
                          onClick={() => setSelectedDayDetails({ dateStr: cell.dateStr, requests: cell.requests, payments: cell.payments })}
                          className="text-[10px] text-slate-500 font-semibold hover:underline block text-center"
                        >
                          +{cell.requests.length - 2} mais
                        </button>
                      )}

                    </div>

                    {/* Day bottom status line (contingent warning if 2+ away on current month) */}
                    {cell.isCurrentMonth && cell.requests.length >= 2 && (
                      <div className="pt-1 mt-1 border-t border-slate-100 flex items-center gap-1 text-[9px] text-amber-700 font-medium">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                        <span>{cell.requests.length} ausentes</span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: LINHA DO TEMPO / ESCALA POR COLABORADOR (TIMELINE/GANTT) */}
      {viewMode === 'timeline' && (
        <div className="overflow-x-auto p-4">
          <div className="min-w-[950px]">
            
            {/* Header: Days 1 to daysInMonth */}
            <div className="grid grid-cols-12 border-b border-slate-200 pb-2 mb-2 text-xs font-semibold text-slate-500">
              <div className="col-span-3">Colaborador Clínico / Setor</div>
              <div className="col-span-9 flex items-center justify-between text-[11px] font-mono">
                {Array.from({ length: Math.min(daysInMonth, 31) }, (_, i) => i + 1).map(day => (
                  <span 
                    key={day} 
                    className={`w-6 text-center py-0.5 rounded ${
                      day === 30 && month === 8 ? 'bg-sky-600 text-white font-bold' : ''
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            {/* Staff Rows */}
            <div className="divide-y divide-slate-100 space-y-2">
              {timelineUsers.map(staff => {
                // Find all requests for this staff
                const userRequests = allRequests.filter(r => r.userId === staff.id && r.status !== 'rejeitado');

                return (
                  <div key={staff.id} className="grid grid-cols-12 items-center py-2.5 hover:bg-slate-50/80 rounded-xl transition-colors px-2">
                    
                    {/* Colaborador Info */}
                    <div className="col-span-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {staff.avatarInitials || staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <button
                            onClick={() => {
                              const pending = userRequests.find(r => r.status === 'pendente_supervisor' || r.status === 'remanejado') || userRequests[0];
                              if (pending && onRemanejarRequest && currentUser.role === 'supervisor') {
                                onRemanejarRequest(pending);
                              }
                            }}
                            className="font-bold text-xs text-slate-900 truncate hover:text-sky-700 hover:underline text-left block"
                            title="Clique para gerenciar/remanejar férias deste colaborador"
                          >
                            {staff.name}
                          </button>
                          <p className="text-[10px] text-slate-500 truncate">{staff.jobTitle}</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline visualization across days */}
                    <div className="col-span-9 relative h-8 bg-slate-100 rounded-lg overflow-hidden flex items-center">
                      
                      {/* Grid background ticks */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                        {Array.from({ length: daysInMonth }, (_, i) => (
                          <div key={i} className="w-[1px] h-full bg-slate-400"></div>
                        ))}
                      </div>

                      {/* Vacation spans */}
                      {userRequests.map(req => {
                        const activeStart = req.rescheduledStartDate || req.startDate;
                        const activeEnd = req.rescheduledEndDate || req.endDate;

                        const sDate = new Date(activeStart + 'T00:00:00');
                        const eDate = new Date(activeEnd + 'T00:00:00');

                        // Check if in current displayed month
                        const startMonth = sDate.getMonth();
                        const startYear = sDate.getFullYear();
                        const endMonth = eDate.getMonth();
                        const endYear = eDate.getFullYear();

                        // Check overlap with this month
                        const monthStart = new Date(year, month, 1);
                        const monthEnd = new Date(year, month, daysInMonth);

                        if (eDate < monthStart || sDate > monthEnd) return null;

                        // Calculate left percentage and width percentage
                        const clampedStart = sDate < monthStart ? 1 : sDate.getDate();
                        const clampedEnd = eDate > monthEnd ? daysInMonth : eDate.getDate();

                        const leftPercent = ((clampedStart - 1) / daysInMonth) * 100;
                        const widthPercent = Math.max(4, ((clampedEnd - clampedStart + 1) / daysInMonth) * 100);

                        return (
                          <div
                            key={req.id}
                            onClick={() => {
                              if (onRemanejarRequest && (currentUser.role === 'supervisor' || currentUser.role === 'adm')) {
                                onRemanejarRequest(req);
                              }
                            }}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            className={`absolute h-6 rounded-md px-2 flex items-center justify-between text-[10px] font-bold cursor-pointer transition-all border shadow-xs ${getStatusStyle(req.status)}`}
                            title={`${req.userName}: ${formatDateDisplay(activeStart)} a ${formatDateDisplay(activeEnd)} (${req.daysRequested} dias). Clique para remanejar.`}
                          >
                            <span className="truncate">
                              {req.daysRequested}d Férias
                            </span>
                            {currentUser.role === 'supervisor' && (
                              <ArrowRightLeft className="w-3 h-3 text-purple-700 ml-1 shrink-0" />
                            )}
                          </div>
                        );
                      })}

                      {/* If no requests in this month */}
                      {userRequests.length === 0 && (
                        <span className="text-[10px] text-slate-400 pl-3">Em atividade regular no plantão</span>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Modal: Detalhes do Dia Selecionado */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-sky-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Agenda do Dia: {formatDateDisplay(selectedDayDetails.dateStr)}
                </h3>
                <p className="text-xs text-sky-100">HeyLife Hospital · Escala & Previsão Financeira</p>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              
              {/* Vacation Requests on this date */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-sky-600" />
                  <span>Colaboradores em Período de Férias ({selectedDayDetails.requests.length})</span>
                </h4>

                {selectedDayDetails.requests.length === 0 ? (
                  <p className="text-slate-400 italic py-2">Nenhum colaborador afastado por férias nesta data.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayDetails.requests.map(req => (
                      <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{req.userName}</div>
                          <p className="text-[11px] text-slate-500">{req.userJobTitle} · {req.userDepartment}</p>
                          <p className="text-[11px] text-sky-700 mt-1">
                            Período: {formatDateDisplay(req.startDate)} a {formatDateDisplay(req.endDate)} ({req.daysRequested} dias)
                          </p>
                        </div>

                        {currentUser.role === 'supervisor' && onRemanejarRequest && (
                          <button
                            onClick={() => {
                              setSelectedDayDetails(null);
                              onRemanejarRequest(req);
                            }}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Remanejar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments on this date */}
              {selectedDayDetails.payments.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Pagamentos de Férias Programados ({selectedDayDetails.payments.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {selectedDayDetails.payments.map(pay => (
                      <div key={pay.id} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-emerald-950">{pay.userName}</div>
                          <p className="text-[11px] text-slate-600">{pay.userDepartment}</p>
                          <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                            Valor Líquido: {formatCurrency(pay.estimatedNetTotal)}
                          </p>
                        </div>

                        {onViewPayment && (
                          <button
                            onClick={() => {
                              setSelectedDayDetails(null);
                              onViewPayment(pay);
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            Ver Recibo
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick request trigger on date if user is funcionario */}
              {currentUser.role === 'funcionario' && onRequestVacationOnDate && (
                <div className="pt-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      const date = selectedDayDetails.dateStr;
                      setSelectedDayDetails(null);
                      onRequestVacationOnDate(date);
                    }}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Solicitar Férias Iniciando em {formatDateDisplay(selectedDayDetails.dateStr)}
                  </button>
                </div>
              )}

            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
