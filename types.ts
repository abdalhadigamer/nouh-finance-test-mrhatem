
export enum UserRole {
  GENERAL_MANAGER = 'General Manager',
  FINANCE_MANAGER = 'Finance Manager',
  ACCOUNTANT = 'Accountant',
  ENGINEER = 'Engineer',
  PROCUREMENT = 'Procurement',
  CLIENT = 'Client',
  EMPLOYEE = 'Employee'
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

export enum InvoiceType {
  SALES = 'مبيعات',
  PURCHASE = 'مشتريات',
  SUPPLIER = 'موردين'
}

export enum TransactionType {
  RECEIPT = 'سند قبض',
  PAYMENT = 'سند صرف',
  TRANSFER = 'تحويل',
  JOURNAL = 'قيد يومية'
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

// New Interface for Agreements
export interface Agreement {
  id: string;
  employeeId: string; // Link to Craftsman/Worker
  employeeName?: string; // Helper
  title: string; // e.g. "اتفاقية أعمال سباكة كاملة"
  amount: number; // Total Agreed Amount
  date: string;
  attachmentUrl?: string; // Contract Image/PDF
}

// New Interface for Notes
export interface ProjectNote {
  id: string;
  content: string;
  date: string;
  author?: string;
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
  agreedLaborBudget?: number; // NEW FIELD: Fix the labor cost for Lump Sum
  location: string;
  status: ProjectStatus;
  type: ProjectType;
  progress: number;
  startDate: string;
  revenue: number;
  expenses: number;
  clientUsername?: string;
  clientPassword?: string;
  // New Fields
  agreements?: Agreement[];
  notes?: ProjectNote[];
  // Workshop Fund Features
  workshopBalance?: number; // Current money available in the workshop fund
  workshopThreshold?: number; // The "Zero Point" or minimum alert limit
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  projectId: string; 
  amount: number;
  type: InvoiceType;
  category: string; 
  status: 'Paid' | 'Pending' | 'Overdue';
  attachmentUrl?: string;
  attachments?: AppDocument[];
  supplierOrClient?: string;
  relatedEmployeeId?: string; 
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // Entry Date (Visible to Client immediately)
  amount: number;
  currency: 'USD' | 'SYP'; 
  description: string;
  projectId?: string;
  referenceId?: string; 
  fromAccount: string;
  toAccount: string;
  attachmentUrl?: string; 
  recipientType?: 'Staff' | 'Craftsman' | 'Worker' | 'Client' | 'Supplier' | 'Other'; 
  recipientId?: string; 
  recipientName?: string;
  
  // Settlement Logic
  status?: 'Completed' | 'Pending_Settlement'; // Completed = Paid from Main Treasury/Finalized. Pending = Paid from Workshop, needs reimbursement.
  actualPaymentDate?: string; // The real date money left the Main Treasury
}

// Union type for mixed tables (Ledger)
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

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number; 
  deductions: number; 
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
