import { 
  User, 
  VacationRequest, 
  VacationPayment, 
  Department, 
  SupabaseConfig, 
  NotificationItem 
} from '../types';

const USERS_KEY = 'heylife_users_v1';
const REQUESTS_KEY = 'heylife_vacation_requests_v1';
const PAYMENTS_KEY = 'heylife_vacation_payments_v1';
const DEPARTMENTS_KEY = 'heylife_departments_v1';
const SUPABASE_CONFIG_KEY = 'heylife_supabase_config_v1';
const NOTIFICATIONS_KEY = 'heylife_notifications_v1';
const CURRENT_USER_KEY = 'heylife_current_user_id_v1';

// Seed Initial Departments
export const initialDepartments: Department[] = [
  {
    id: 'dep_uti',
    name: 'UTI Adulto & Coronariana',
    description: 'Unidade de Terapia Intensiva com 24 leitos de alta complexidade.',
    headSupervisorId: 'usr_sup_1',
    minClinicalStaffRequired: 4,
  },
  {
    id: 'dep_cc',
    name: 'Centro Cirúrgico & RPA',
    description: 'Bloco operatório com 8 salas de cirurgias eletivas e de urgência.',
    headSupervisorId: 'usr_sup_1',
    minClinicalStaffRequired: 3,
  },
  {
    id: 'dep_pa',
    name: 'Pronto Atendimento & Emergência',
    description: 'Atendimento 24h para urgências clínicas e cirúrgicas.',
    headSupervisorId: 'usr_sup_2',
    minClinicalStaffRequired: 5,
  },
  {
    id: 'dep_ped',
    name: 'Pediatria & UTI Neo',
    description: 'Cuidados intensivos e internação materno-infantil.',
    headSupervisorId: 'usr_sup_2',
    minClinicalStaffRequired: 3,
  },
  {
    id: 'dep_farm',
    name: 'Farmácia Clínica Hospitalar',
    description: 'Dispensação de medicamentos de alto custo e controle de estoques.',
    headSupervisorId: 'usr_rh_1',
    minClinicalStaffRequired: 2,
  },
  {
    id: 'dep_rh',
    name: 'Gestão de Pessoas & RH Clínico',
    description: 'Departamento pessoal, escalas trabalhistas e relações hospitalares.',
    headSupervisorId: 'usr_adm_1',
    minClinicalStaffRequired: 2,
  },
];

// Seed Initial Users with realistic clinical roles
export const initialUsers: User[] = [
  {
    id: 'usr_adm_1',
    name: 'Dr. Roberto Albuquerque',
    email: 'roberto.adm@heylife.hospital',
    role: 'adm',
    department: 'Diretoria Médica & Hospitalar',
    jobTitle: 'Diretor Clínico & Administrador Geral',
    crmCoren: 'CRM-SP 98214',
    admissionDate: '2019-03-15',
    vacationBalance: 30,
    totalDaysAcquired: 30,
    daysUsed: 0,
    accruedPeriodStart: '2025-03-15',
    accruedPeriodEnd: '2026-03-14',
    concessivePeriodDeadline: '2027-02-15',
    baseSalary: 28500,
    status: 'ativo',
    avatarInitials: 'RA',
  },
  {
    id: 'usr_rh_1',
    name: 'Dra. Camila Duarte',
    email: 'camila.rh@heylife.hospital',
    role: 'rh',
    department: 'Gestão de Pessoas & RH Clínico',
    jobTitle: 'Coordenadora de Recursos Humanos',
    crmCoren: 'CRA-SP 45190',
    admissionDate: '2021-06-01',
    vacationBalance: 20,
    totalDaysAcquired: 30,
    daysUsed: 10,
    accruedPeriodStart: '2025-06-01',
    accruedPeriodEnd: '2026-05-31',
    concessivePeriodDeadline: '2027-04-30',
    baseSalary: 12400,
    status: 'ativo',
    avatarInitials: 'CD',
  },
  {
    id: 'usr_sup_1',
    name: 'Enf. Chefe Marcos Vinícius',
    email: 'marcos.supervisor@heylife.hospital',
    role: 'supervisor',
    department: 'UTI Adulto & Coronariana',
    jobTitle: 'Supervisor de Enfermagem UTI & Centro Cirúrgico',
    crmCoren: 'COREN-SP 184920',
    admissionDate: '2020-08-10',
    vacationBalance: 15,
    totalDaysAcquired: 30,
    daysUsed: 15,
    accruedPeriodStart: '2025-08-10',
    accruedPeriodEnd: '2026-08-09',
    concessivePeriodDeadline: '2027-07-10',
    baseSalary: 11200,
    status: 'ativo',
    avatarInitials: 'MV',
  },
  {
    id: 'usr_sup_2',
    name: 'Dra. Mariana Rios',
    email: 'mariana.supervisor@heylife.hospital',
    role: 'supervisor',
    department: 'Pronto Atendimento & Emergência',
    jobTitle: 'Supervisora Médica de Emergência & Pediatria',
    crmCoren: 'CRM-SP 142890',
    admissionDate: '2022-01-10',
    vacationBalance: 30,
    totalDaysAcquired: 30,
    daysUsed: 0,
    accruedPeriodStart: '2025-01-10',
    accruedPeriodEnd: '2026-01-09',
    concessivePeriodDeadline: '2026-12-10',
    baseSalary: 19800,
    status: 'ativo',
    avatarInitials: 'MR',
  },
  {
    id: 'usr_func_1',
    name: 'Dra. Larissa Mendes',
    email: 'larissa.plantonista@heylife.hospital',
    role: 'funcionario',
    department: 'UTI Adulto & Coronariana',
    jobTitle: 'Médica Intensivista Plantonista',
    crmCoren: 'CRM-SP 165432',
    supervisorId: 'usr_sup_1',
    supervisorName: 'Enf. Chefe Marcos Vinícius',
    admissionDate: '2023-04-18',
    vacationBalance: 30,
    totalDaysAcquired: 30,
    daysUsed: 0,
    accruedPeriodStart: '2025-04-18',
    accruedPeriodEnd: '2026-04-17',
    concessivePeriodDeadline: '2027-03-18',
    baseSalary: 17500,
    status: 'ativo',
    avatarInitials: 'LM',
  },
  {
    id: 'usr_func_2',
    name: 'Téc. Juliana Rocha',
    email: 'juliana.enfermagem@heylife.hospital',
    role: 'funcionario',
    department: 'UTI Adulto & Coronariana',
    jobTitle: 'Técnica de Enfermagem em Cuidados Críticos',
    crmCoren: 'COREN-SP 492104',
    supervisorId: 'usr_sup_1',
    supervisorName: 'Enf. Chefe Marcos Vinícius',
    admissionDate: '2022-09-01',
    vacationBalance: 20,
    totalDaysAcquired: 30,
    daysUsed: 10,
    accruedPeriodStart: '2024-09-01',
    accruedPeriodEnd: '2025-08-31',
    concessivePeriodDeadline: '2026-07-31',
    baseSalary: 4850,
    status: 'ativo',
    avatarInitials: 'JR',
  },
  {
    id: 'usr_func_3',
    name: 'Dr. Felipe Nogueira',
    email: 'felipe.cirurgia@heylife.hospital',
    role: 'funcionario',
    department: 'Centro Cirúrgico & RPA',
    jobTitle: 'Cirurgião Geral & Vídeo-Laparoscopia',
    crmCoren: 'CRM-SP 139871',
    supervisorId: 'usr_sup_1',
    supervisorName: 'Enf. Chefe Marcos Vinícius',
    admissionDate: '2021-11-20',
    vacationBalance: 30,
    totalDaysAcquired: 30,
    daysUsed: 0,
    accruedPeriodStart: '2024-11-20',
    accruedPeriodEnd: '2025-11-19',
    concessivePeriodDeadline: '2026-10-20',
    baseSalary: 21000,
    status: 'ativo',
    avatarInitials: 'FN',
  },
  {
    id: 'usr_func_4',
    name: 'Fisiot. André Silveira',
    email: 'andre.fisioterapia@heylife.hospital',
    role: 'funcionario',
    department: 'Pronto Atendimento & Emergência',
    jobTitle: 'Fisioterapeuta Respiratório Hospitalar',
    crmCoren: 'CREFITO 84729-F',
    supervisorId: 'usr_sup_2',
    supervisorName: 'Dra. Mariana Rios',
    admissionDate: '2022-03-10',
    vacationBalance: 15,
    totalDaysAcquired: 30,
    daysUsed: 15,
    accruedPeriodStart: '2025-03-10',
    accruedPeriodEnd: '2026-03-09',
    concessivePeriodDeadline: '2027-02-10',
    baseSalary: 6200,
    status: 'ativo',
    avatarInitials: 'AS',
  },
  {
    id: 'usr_func_5',
    name: 'Farm. Beatriz Lima',
    email: 'beatriz.farmacia@heylife.hospital',
    role: 'funcionario',
    department: 'Farmácia Clínica Hospitalar',
    jobTitle: 'Farmacêutica Hospitalar Especialista',
    crmCoren: 'CRF-SP 52194',
    supervisorId: 'usr_rh_1',
    supervisorName: 'Dra. Camila Duarte',
    admissionDate: '2023-01-15',
    vacationBalance: 30,
    totalDaysAcquired: 30,
    daysUsed: 0,
    accruedPeriodStart: '2025-01-15',
    accruedPeriodEnd: '2026-01-14',
    concessivePeriodDeadline: '2026-12-15',
    baseSalary: 7100,
    status: 'ativo',
    avatarInitials: 'BL',
  },
];

// Seed Initial Vacation Requests
export const initialRequests: VacationRequest[] = [
  {
    id: 'req_101',
    userId: 'usr_func_1',
    userName: 'Dra. Larissa Mendes',
    userJobTitle: 'Médica Intensivista Plantonista',
    userDepartment: 'UTI Adulto & Coronariana',
    supervisorId: 'usr_sup_1',
    supervisorName: 'Enf. Chefe Marcos Vinícius',
    startDate: '2026-11-02',
    endDate: '2026-11-16',
    daysRequested: 15,
    sellTenDays: true,
    advanceThirteenth: true,
    reason: 'Descanso pós-ciclo de plantões intensivos e participação em congresso.',
    status: 'pendente_supervisor',
    createdAt: '2026-09-20T10:15:00Z',
    updatedAt: '2026-09-20T10:15:00Z',
  },
  {
    id: 'req_102',
    userId: 'usr_func_2',
    userName: 'Téc. Juliana Rocha',
    userJobTitle: 'Técnica de Enfermagem em Cuidados Críticos',
    userDepartment: 'UTI Adulto & Coronariana',
    supervisorId: 'usr_sup_1',
    supervisorName: 'Enf. Chefe Marcos Vinícius',
    startDate: '2026-10-15',
    endDate: '2026-11-03',
    daysRequested: 20,
    sellTenDays: false,
    advanceThirteenth: false,
    reason: 'Viagem em família programada há 1 ano.',
    status: 'remanejado',
    supervisorNotes: 'Período solicitado coincide com reforma do bloco 2 da UTI e ausência de 2 outros plantonistas.',
    rescheduledStartDate: '2026-11-09',
    rescheduledEndDate: '2026-11-28',
    rescheduledReason: 'Para manter o contingente mínimo de 4 profissionais na escala crítica da UTI. Período sugerido possui cobertura completa.',
    rescheduledBy: 'Enf. Chefe Marcos Vinícius',
    createdAt: '2026-09-12T14:30:00Z',
    updatedAt: '2026-09-15T09:20:00Z',
  },
  {
    id: 'req_103',
    userId: 'usr_func_3',
    userName: 'Dr. Felipe Nogueira',
    userJobTitle: 'Cirurgião Geral & Vídeo-Laparoscopia',
    userDepartment: 'Centro Cirúrgico & RPA',
    supervisorId: 'usr_sup_1',
    supervisorName: 'Enf. Chefe Marcos Vinícius',
    startDate: '2026-12-01',
    endDate: '2026-12-30',
    daysRequested: 30,
    sellTenDays: false,
    advanceThirteenth: true,
    reason: 'Férias integrais para viagem ao exterior.',
    status: 'aprovado_supervisor',
    supervisorNotes: 'Escala cirúrgica remanejada com Dr. Rodrigo cobrindo as terças e quintas. Aprovado pelo supervisor.',
    createdAt: '2026-09-18T16:00:00Z',
    updatedAt: '2026-09-22T11:00:00Z',
  },
  {
    id: 'req_104',
    userId: 'usr_func_4',
    userName: 'Fisiot. André Silveira',
    userJobTitle: 'Fisioterapeuta Respiratório Hospitalar',
    userDepartment: 'Pronto Atendimento & Emergência',
    supervisorId: 'usr_sup_2',
    supervisorName: 'Dra. Mariana Rios',
    startDate: '2026-10-05',
    endDate: '2026-10-19',
    daysRequested: 15,
    sellTenDays: false,
    advanceThirteenth: false,
    reason: 'Recesso de meio de ano programado com a chefia médica.',
    status: 'aprovado_rh',
    supervisorNotes: 'Autorizado sem impacto no atendimento do PA.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-05T14:10:00Z',
  },
];

// Calculate vacation financial amounts based on CLT regulations
export function calculateVacationFinancials(
  baseSalary: number, 
  days: number, 
  sellTenDays: boolean, 
  advanceThirteenth: boolean,
  startDate: string
): Omit<VacationPayment, 'id' | 'vacationRequestId' | 'userId' | 'userName' | 'userDepartment'> {
  const dailyRate = baseSalary / 30;
  const vacationPay = Math.round(dailyRate * days * 100) / 100;
  const constitutionalBonus = Math.round((vacationPay / 3) * 100) / 100;
  
  // Abono pecuniário (10 dias de salário + 1/3 do abono, isento de INSS/IRRF)
  let pecuniaryBonus = 0;
  if (sellTenDays) {
    const rawAbono = dailyRate * 10;
    const thirdAbono = rawAbono / 3;
    pecuniaryBonus = Math.round((rawAbono + thirdAbono) * 100) / 100;
  }

  // 13º Adiantamento (50% do salário base, sem encargos imediatos)
  const thirteenthAdvance = advanceThirteenth ? Math.round((baseSalary * 0.5) * 100) / 100 : 0;

  const estimatedGrossTotal = Math.round((vacationPay + constitutionalBonus + pecuniaryBonus + thirteenthAdvance) * 100) / 100;

  // Encargos estimados sobre férias + 1/3 (~14% simplificado CLT)
  const taxableBasis = vacationPay + constitutionalBonus;
  const estimatedDeductions = Math.round((taxableBasis * 0.14) * 100) / 100;
  const estimatedNetTotal = Math.round((estimatedGrossTotal - estimatedDeductions) * 100) / 100;

  // CLT Art. 145: Pagamento deve ser feito até 2 dias antes do início das férias
  const start = new Date(startDate + 'T00:00:00');
  const paymentDateObj = new Date(start);
  paymentDateObj.setDate(start.getDate() - 2);
  const paymentScheduledDate = paymentDateObj.toISOString().split('T')[0];

  return {
    baseSalary,
    vacationDays: days,
    vacationPay,
    constitutionalBonus,
    pecuniaryBonus,
    thirteenthAdvance,
    estimatedGrossTotal,
    estimatedDeductions,
    estimatedNetTotal,
    paymentScheduledDate,
    paymentStatus: 'agendado',
    paymentReceiptNumber: 'REC-' + Math.floor(100000 + Math.random() * 900000),
    notes: 'Programação de pagamento automatizada conforme CLT Art. 145.',
  };
}

// Initial Payments
export const initialPayments: VacationPayment[] = [
  {
    id: 'pay_104',
    vacationRequestId: 'req_104',
    userId: 'usr_func_4',
    userName: 'Fisiot. André Silveira',
    userDepartment: 'Pronto Atendimento & Emergência',
    baseSalary: 6200,
    vacationDays: 15,
    vacationPay: 3100,
    constitutionalBonus: 1033.33,
    pecuniaryBonus: 0,
    thirteenthAdvance: 0,
    estimatedGrossTotal: 4133.33,
    estimatedDeductions: 578.67,
    estimatedNetTotal: 3554.66,
    paymentScheduledDate: '2026-10-03',
    paymentStatus: 'agendado',
    paymentReceiptNumber: 'REC-892104',
    notes: 'Folha de pagamento liberada pelo RH. Depósito bancário agendado para 2 dias antes do início das férias.',
  },
  {
    id: 'pay_103',
    vacationRequestId: 'req_103',
    userId: 'usr_func_3',
    userName: 'Dr. Felipe Nogueira',
    userDepartment: 'Centro Cirúrgico & RPA',
    baseSalary: 21000,
    vacationDays: 30,
    vacationPay: 21000,
    constitutionalBonus: 7000,
    pecuniaryBonus: 0,
    thirteenthAdvance: 10500,
    estimatedGrossTotal: 38500,
    estimatedDeductions: 3920,
    estimatedNetTotal: 34580,
    paymentScheduledDate: '2026-11-29',
    paymentStatus: 'pendente',
    paymentReceiptNumber: 'REC-398711',
    notes: 'Em análise final de folha pelo RH. Aguardando aprovação orçamentária hospitalar.',
  },
];

export const defaultSupabaseConfig: SupabaseConfig = {
  url: '',
  anonKey: '',
  isConnected: false,
  syncEnabled: false,
  lastTestedAt: undefined,
  errorMessage: undefined,
};

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'usr_func_2',
    title: 'Data de Férias Remanejada pelo Supervisor',
    message: 'Enf. Marcos Vinícius propôs novo período (09/11 a 28/11) para garantir contingente mínimo da UTI. Verifique no seu painel.',
    type: 'warning',
    timestamp: '2026-09-15T09:20:00Z',
    read: false,
  },
  {
    id: 'notif_2',
    userId: 'usr_rh_1',
    title: 'Nova Solicitação Aprovada pelo Supervisor',
    message: 'Dr. Felipe Nogueira teve 30 dias aprovados pela chefia médica. Pronto para agendamento de pagamento no RH.',
    type: 'info',
    timestamp: '2026-09-22T11:00:00Z',
    read: false,
  },
  {
    id: 'notif_3',
    userId: 'usr_func_4',
    title: 'Férias e Pagamento Agendados',
    message: 'Seu adiantamento de R$ 3.554,66 foi agendado para o dia 03/10 (2 dias úteis antes das férias).',
    type: 'success',
    timestamp: '2026-09-05T14:10:00Z',
    read: true,
  },
];

// Storage Helpers
class StorageService {
  // Users
  getUsers(): User[] {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialUsers;
    }
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index >= 0) {
      users[index] = updatedUser;
      this.saveUsers(users);
    }
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);
  }

  // Current Logged In User
  getCurrentUserId(): string | null {
    return localStorage.getItem(CURRENT_USER_KEY);
  }

  setCurrentUserId(id: string | null): void {
    if (id) {
      localStorage.setItem(CURRENT_USER_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  getCurrentUser(): User | null {
    const currentId = this.getCurrentUserId();
    if (!currentId) return null;
    const users = this.getUsers();
    return users.find(u => u.id === currentId) || null;
  }

  // Requests
  getRequests(): VacationRequest[] {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(initialRequests));
      return initialRequests;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialRequests;
    }
  }

  saveRequests(requests: VacationRequest[]): void {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  }

  addRequest(request: VacationRequest): void {
    const requests = this.getRequests();
    requests.unshift(request);
    this.saveRequests(requests);

    // Also deduct or update user vacation balance
    const users = this.getUsers();
    const user = users.find(u => u.id === request.userId);
    if (user) {
      user.vacationBalance = Math.max(0, user.vacationBalance - request.daysRequested);
      user.daysUsed = user.daysUsed + request.daysRequested;
      this.saveUsers(users);
    }
  }

  updateRequest(updatedReq: VacationRequest): void {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id === updatedReq.id);
    if (index >= 0) {
      requests[index] = updatedReq;
      this.saveRequests(requests);
    }
  }

  // Payments
  getPayments(): VacationPayment[] {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(initialPayments));
      return initialPayments;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialPayments;
    }
  }

  savePayments(payments: VacationPayment[]): void {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }

  addOrUpdatePayment(payment: VacationPayment): void {
    const payments = this.getPayments();
    const index = payments.findIndex(p => p.vacationRequestId === payment.vacationRequestId);
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.unshift(payment);
    }
    this.savePayments(payments);
  }

  // Departments
  getDepartments(): Department[] {
    const raw = localStorage.getItem(DEPARTMENTS_KEY);
    if (!raw) {
      localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(initialDepartments));
      return initialDepartments;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialDepartments;
    }
  }

  saveDepartments(departments: Department[]): void {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  }

  // Supabase Configuration (Strictly for ADM)
  getSupabaseConfig(): SupabaseConfig {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (!raw) {
      return defaultSupabaseConfig;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return defaultSupabaseConfig;
    }
  }

  saveSupabaseConfig(config: SupabaseConfig): void {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initialNotifications));
      return initialNotifications;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialNotifications;
    }
  }

  saveNotifications(notifs: NotificationItem[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  }

  addNotification(notif: NotificationItem): void {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    this.saveNotifications(notifs);
  }

  markAllNotificationsAsRead(userId: string): void {
    const notifs = this.getNotifications();
    notifs.forEach(n => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
      }
    });
    this.saveNotifications(notifs);
  }

  // Reset to seed data for testing
  resetAllToDefaults(): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(initialRequests));
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(initialPayments));
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(initialDepartments));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initialNotifications));
  }
}

export const storage = new StorageService();
