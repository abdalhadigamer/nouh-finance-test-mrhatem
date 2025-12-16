
import { Project, Invoice, Transaction, User, UserRole, Client, Employee, PayrollRecord, AttendanceRecord, DailyReport, ArchiveFile, Notification, Trustee, TrustTransaction, Investor, InvestorTransaction, RolePermissions, ActivityLog } from './types';

// --- SYSTEM USERS (Default Accounts) ---
export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'المدير العام', 
    role: UserRole.GENERAL_MANAGER, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 
    email: 'admin@noah.com',
    password: '123'
  },
  {
    id: '2',
    name: 'المدير المالي',
    role: UserRole.FINANCE_MANAGER, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Finance',
    email: 'finance@noah.com',
    password: '123'
  },
  {
    id: '3',
    name: 'المحاسب',
    role: UserRole.ACCOUNTANT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Accountant',
    email: 'acc@noah.com',
    password: '123'
  }
];

export const DEFAULT_PERMISSIONS: RolePermissions[] = [
  {
    role: UserRole.GENERAL_MANAGER,
    canView: [
      'dashboard', 'financial_stats', 'projects', 'clients', 'company_expenses', 'profit_loss', 
      'investors', 'trusts', 'invoices', 'transactions', 'reports', 'hr', 'files', 'settings', 'activity_log'
    ]
  },
  {
    role: UserRole.FINANCE_MANAGER,
    canView: [
      'dashboard', 'financial_stats', 'projects', 'company_expenses', 'profit_loss', 
      'invoices', 'transactions', 'reports', 'hr', 'files', 'activity_log'
    ]
  },
  {
    role: UserRole.ACCOUNTANT,
    canView: [
      'dashboard', 'projects', 'invoices', 'transactions', 'files'
    ]
  }
];

export const LOGO_URL = 'https://cdn-icons-png.flaticon.com/512/1048/1048927.png';

// --- INITIAL EMPTY STATE ---
export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [];
export const MOCK_CLIENTS: Client[] = [];
export const MOCK_TRUSTEES: Trustee[] = [];
export const MOCK_TRUST_TRANSACTIONS: TrustTransaction[] = [];
export const MOCK_INVESTORS: Investor[] = [];
export const MOCK_INVESTOR_TRANSACTIONS: InvestorTransaction[] = [];
export const MOCK_EMPLOYEES: Employee[] = [];
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_INVOICES: Invoice[] = [];
export const MOCK_TRANSACTIONS: Transaction[] = [];
export const MOCK_SYP_TRANSACTIONS: Transaction[] = [];
export const MOCK_PAYROLL: PayrollRecord[] = [];
export const MOCK_ATTENDANCE: AttendanceRecord[] = [];
export const MOCK_DAILY_REPORTS: DailyReport[] = [];
export const MOCK_FILES: ArchiveFile[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
