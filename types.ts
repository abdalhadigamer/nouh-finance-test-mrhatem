
export enum UserRole {
  GENERAL_MANAGER = 'General Manager',
  FINANCE_MANAGER = 'Finance Manager',
  ACCOUNTANT = 'Accountant',
  ENGINEER = 'Engineer',
  PROCUREMENT = 'Procurement',
  CLIENT = 'Client',
  EMPLOYEE = 'Employee',
  TRUSTEE = 'Trustee',
  INVESTOR = 'Investor'
}

export type SystemModule = 
  | 'dashboard'
  | 'financial_stats' // Specific permission to see totals/profits on dashboard
  | 'projects'
  | 'clients'
  | 'company_expenses'
  | 'profit_loss'
  | 'investors'
  | 'trusts'
  | 'invoices'
  | 'transactions'
  | 'reports'
  | 'hr'
  | 'files'
  | 'settings'
  | 'activity_log'; // NEW: Audit Log Module

export interface RolePermissions {
  role: UserRole;
  canView: SystemModule[];
  canEdit?: SystemModule[];
}

export enum EmployeeType {
  STAFF = 'Staff', // Admin, Engineers, Managers
  CRAFTSMAN = 'Craftsman', // Plumber, Electrician, Carpenter
  WORKER = 'Worker' // Daily Labor
}

export enum ProjectStatus {
  DESIGN = 'تصميم',
  EXECUTION = 'تنفيذ',
  DELIVERED = 'تم التسليم',
  DELAYED = 'مؤجل',
  STOPPED = 'متوقف',
  PROPOSED = 'مقترح'
}

export enum ProjectType {
  DESIGN = 'مشروع تصميم',
  EXECUTION = 'مشروع تنفيذ',
  SUPERVISION = 'إشراف هندسي',
  OTHER = 'أخرى'
}

export enum ContractType {
  PERCENTAGE = 'نسبة (Cost Plus)',
  LUMP_SUM = 'مبلغ مقطوع (Lump Sum)'
}

// Simplified Invoice Type - All are purchases/expenses
export enum InvoiceType {
  PURCHASE = 'مشتريات مواد',
  SERVICE = 'خدمات',
  EXPENSE = 'مصاريف أخرى',
  SALES = 'مبيعات'
}

export enum TransactionType {
  RECEIPT = 'سند قبض',
  PAYMENT = 'سند صرف',
  TRANSFER = 'تحويل',
  JOURNAL = 'قيد يومية'
}

// NEW: Activity Log Interface
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole | string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT';
  entity: 'Transaction' | 'Invoice' | 'Project' | 'Client' | 'Employee' | 'Settings';
  entityId?: string;
  description: string;
  timestamp: string; // ISO String
}

export interface AppDocument {
  id: string;
  name: string;
  type: string; // 'Contract', 'ID', 'Invoice', 'Other'
  url: string;
  date: string;
}

export interface ArchiveFile {
  id: string;
  name: string;
  type: 'folder' | 'pdf' | 'image' | 'excel' | 'word';
  size?: string;
  date: string;
  parentId?: string; // For nested folders
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  clientUsername?: string; 
  employeeId?: string; 
  trusteeId?: string;
  investorId?: string; // New Link
  password?: string; // For mock login simulation
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  avatar?: string;
  joinDate: string;
  documents?: AppDocument[];
}

export interface Trustee {
  id: string;
  name: string;
  relation: string; 
  phone: string;
  avatar?: string;
  notes?: string;
  username?: string;
  password?: string;
}

export interface TrustTransaction {
  id: string;
  trusteeId: string;
  type: 'Deposit' | 'Withdrawal'; 
  amount: number;
  date: string;
  notes: string;
  attachmentUrl?: string;
}

// NEW: Investor Interface Updated
export interface Investor {
  id: string;
  name: string;
  type: 'Capital' | 'Partner'; // Capital = Money only, Partner = Work/Effort
  agreementDetails: string; 
  profitPercentage?: number; // NEW: For Capital Investors (Global %)
  linkedProjectIds?: string[]; // NEW: For Partner Investors (Specific Projects)
  phone: string;
  email?: string;
  avatar?: string;
  joinDate: string;
  username?: string;
  password?: string;
}

// NEW: Investor Transaction (Capital vs Profit vs Withdrawal)
export interface InvestorTransaction {
  id: string;
  investorId: string;
  type: 'Capital_Injection' | 'Profit_Distribution' | 'Withdrawal';
  amount: number;
  date: string;
  notes: string;
  projectId?: string; // If profit is from a specific project
}

export interface Agreement {
  id: string;
  employeeId: string; 
  employeeName?: string; 
  title: string; 
  type: 'file' | 'text'; // Updated to support text contracts
  content?: string; // Content for text contracts
  amount: number; 
  date: string;
  attachmentUrl?: string; 
}

export interface ProjectNote {
  id: string;
  content: string;
  date: string;
  author?: string;
}

export interface StatementColumn {
  id: string;
  label: string; 
  type: 'text' | 'number';
}

export interface StatementRow {
  id: string;
  [key: string]: any; 
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientId?: string; 
  budget: number; 
  estimatedCost?: number; 
  contractType?: ContractType; 
  companyPercentage?: number;
  agreedLaborBudget?: number; 
  location: string;
  status: ProjectStatus;
  type: ProjectType;
  progress: number;
  startDate: string;
  revenue: number;
  expenses: number;
  clientUsername?: string;
  clientPassword?: string;
  agreements?: Agreement[];
  notes?: ProjectNote[];
  statementColumns?: StatementColumn[];
  statementRows?: StatementRow[]; 
  workshopBalance?: number; 
  workshopThreshold?: number; 
}

export interface InvoiceItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  [key: string]: any; 
}

export interface Invoice {
  id: string;
  invoiceNumber: string; 
  systemSerial?: string; 
  date: string; 
  projectId: string; 
  supplierName: string; 
  supplierOrClient?: string; 
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number; 
  amount: number; 
  status: 'Paid' | 'Pending' | 'Overdue';
  attachmentUrl?: string; 
  attachments?: string[]; 
  customColumns?: StatementColumn[];
  notes?: string;
  type?: InvoiceType;
  category?: string;
  relatedEmployeeId?: string;
  isClientVisible?: boolean; 
}

export interface Transaction {
  id: string;
  serialNumber?: number; 
  type: TransactionType;
  date: string; 
  amount: number;
  currency: 'USD' | 'SYP'; 
  description: string;
  projectId?: string;
  statementItemId?: string; 
  referenceId?: string; 
  fromAccount: string;
  toAccount: string;
  attachmentUrl?: string; 
  // Expanded recipient types to support Investors and Trustees
  recipientType?: 'Staff' | 'Craftsman' | 'Worker' | 'Client' | 'Supplier' | 'Investor' | 'Trustee' | 'Other'; 
  recipientId?: string; 
  recipientName?: string;
  status?: 'Completed' | 'Pending_Settlement'; 
  actualPaymentDate?: string; 
  hasLinkedInvoice?: boolean;
}

export type LedgerEntry = 
  | (Invoice & { rowType: 'invoice' }) 
  | (Transaction & { rowType: 'payment' | 'receipt' | 'transfer' });

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeProjects: number;
  cashFlowStatus: 'Positive' | 'Negative' | 'Neutral';
}

export interface Employee {
  id: string;
  name: string;
  role: string; 
  type: EmployeeType; 
  department: string;
  salary: number; 
  phone: string;
  email: string;
  joinDate: string;
  avatar: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  username?: string;
  password?: string;
  pettyCashBalance?: number;
  documents?: AppDocument[];
}

export interface PayrollItem {
  name: string;
  amount: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowanceList: PayrollItem[]; 
  deductionList: PayrollItem[]; 
  netSalary: number;
  status: 'Paid' | 'Pending';
  paymentDate?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string; 
  clockOut?: string; 
  status: 'Present' | 'Late' | 'Absent';
  totalHours?: number;
}

export interface Task {
  id: string;
  description: string;
  isCompleted: boolean;
  managerRating?: number; 
  managerComment?: string;
  isPriority?: boolean; 
}

export interface DailyReport {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  completedTasks: Task[];
  planForTomorrow: Task[];
  status: 'Submitted' | 'Reviewed';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
}
