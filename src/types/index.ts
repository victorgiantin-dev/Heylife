export type Role = 'adm' | 'rh' | 'supervisor' | 'funcionario';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  jobTitle: string;
  crmCoren?: string;
  supervisorId?: string | null;
  supervisorName?: string | null;
  admissionDate: string; // YYYY-MM-DD
  vacationBalance: number; // dias restantes disponíveis
  totalDaysAcquired: number; // normalmente 30
  daysUsed: number;
  accruedPeriodStart: string; // início período aquisitivo
  accruedPeriodEnd: string; // fim período aquisitivo
  concessivePeriodDeadline: string; // limite concessivo (prazo legal da CLT antes da dobra)
  baseSalary: number; // para cálculo do pagamento
  status: 'ativo' | 'inativo';
  avatarInitials?: string;
}

export type VacationRequestStatus = 
  | 'pendente_supervisor' 
  | 'remanejado' 
  | 'aprovado_supervisor' 
  | 'aprovado_rh' 
  | 'rejeitado'
  | 'concluido';

export interface VacationRequest {
  id: string;
  userId: string;
  userName: string;
  userJobTitle: string;
  userDepartment: string;
  supervisorId: string;
  supervisorName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysRequested: number;
  sellTenDays: boolean; // Abono pecuniário (venda de 10 dias)
  advanceThirteenth: boolean; // Adiantamento da 1ª parcela do 13º
  reason?: string;
  status: VacationRequestStatus;
  supervisorNotes?: string;
  rescheduledStartDate?: string;
  rescheduledEndDate?: string;
  rescheduledReason?: string;
  rescheduledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VacationPayment {
  id: string;
  vacationRequestId: string;
  userId: string;
  userName: string;
  userDepartment: string;
  baseSalary: number;
  vacationDays: number;
  vacationPay: number; // valor dos dias
  constitutionalBonus: number; // 1/3 constitucional
  pecuniaryBonus: number; // valor do abono se vendeu 10 dias
  thirteenthAdvance: number; // adiantamento de 13º se solicitado
  estimatedGrossTotal: number;
  estimatedDeductions: number;
  estimatedNetTotal: number;
  paymentScheduledDate: string; // 2 dias antes do início
  paymentStatus: 'pendente' | 'agendado' | 'pago' | 'cancelado';
  paymentReceiptNumber?: string;
  paidAt?: string;
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headSupervisorId?: string;
  minClinicalStaffRequired: number; // contingente mínimo para não desfalcar plantão
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
  errorMessage?: string;
  syncEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string; // target user or 'all'
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}
