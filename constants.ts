
import { Project, Invoice, Transaction, User, UserRole, Client, Employee, PayrollRecord, AttendanceRecord, DailyReport, ArchiveFile, Notification, ProjectStatus, ProjectType, InvoiceType, TransactionType, EmployeeType, ContractType, Trustee, TrustTransaction, Investor, InvestorTransaction, RolePermissions, ActivityLog } from './types';

// Helper to get today's date in YYYY-MM-DD format (Local)
const getTodayDate = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const TODAY = getTodayDate();

// Helper for yesterday
const getYesterdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const YESTERDAY = getYesterdayDate();

export const LOGO_URL = 'https://cdn-icons-png.flaticon.com/512/1048/1048927.png';

// --- MOCK USERS (Admin System) ---
export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'المدير العام (CEO)', 
    role: UserRole.GENERAL_MANAGER, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 
    email: 'admin@noah.com',
    password: '123'
  },
  {
    id: '2',
    name: 'أ. سامر (المدير المالي)',
    role: UserRole.FINANCE_MANAGER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Finance',
    email: 'finance@noah.com',
    password: '123'
  },
  {
    id: '3',
    name: 'محاسب الشركة',
    role: UserRole.ACCOUNTANT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Accountant',
    email: 'acc@noah.com',
    password: '123'
  }
];

// --- DEFAULT PERMISSIONS CONFIGURATION ---
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

// NEW: Mock Activity Logs
export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
    {
        id: 'log-1',
        userId: '1',
        userName: 'المدير العام (CEO)',
        userRole: UserRole.GENERAL_MANAGER,
        action: 'UPDATE',
        entity: 'Project',
        description: 'تعديل حالة مشروع "برج الأفق" إلى قيد التنفيذ',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
    },
    {
        id: 'log-2',
        userId: '3',
        userName: 'محاسب الشركة',
        userRole: UserRole.ACCOUNTANT,
        action: 'CREATE',
        entity: 'Transaction',
        description: 'إضافة سند صرف جديد بقيمة 5000$ (عهدة)',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
        id: 'log-3',
        userId: '2',
        userName: 'أ. سامر (المدير المالي)',
        userRole: UserRole.FINANCE_MANAGER,
        action: 'APPROVE',
        entity: 'Invoice',
        description: 'اعتماد فاتورة مشتريات حديد رقم INV-2024-001',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
        id: 'log-4',
        userId: '3',
        userName: 'محاسب الشركة',
        userRole: UserRole.ACCOUNTANT,
        action: 'LOGIN',
        entity: 'Settings',
        description: 'تسجيل دخول للنظام',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
    },
    {
        id: 'log-5',
        userId: '1',
        userName: 'المدير العام (CEO)',
        userRole: UserRole.GENERAL_MANAGER,
        action: 'CREATE',
        entity: 'Client',
        description: 'إضافة عميل جديد "سارة الأحمد"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // Yesterday
    }
];

export const MOCK_CLIENTS: Client[] = [
    { id: 'c1', name: 'شركة الأفق العقارية', companyName: 'مجموعة الأفق', phone: '0501234567', email: 'contact@horizon.sa', username: 'horizon', password: '123', joinDate: '2023-01-10', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Horizon' },
    { id: 'c2', name: 'د. خالد العتيبي', companyName: 'مستوصف الشفاء', phone: '0509876543', email: 'dr.khalid@clinic.com', username: 'khalid', password: '123', joinDate: '2023-02-15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khalid' },
    { id: 'c3', name: 'سارة الأحمد', companyName: '', phone: '0555551111', email: 'sara@gmail.com', username: 'sara', password: '123', joinDate: '2023-03-20', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara' },
    { id: 'c4', name: 'مجموعة الراجحي للمقاولات', companyName: 'الراجحي', phone: '0544443333', email: 'projects@alrajhi.com', username: 'alrajhi', password: '123', joinDate: '2023-04-05', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajhi' },
    { id: 'c5', name: 'مطاعم المذاق العربي', companyName: 'سلسلة مطاعم', phone: '0566667777', email: 'admin@tasty.com', username: 'tasty', password: '123', joinDate: '2023-05-12', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tasty' },
];

export const MOCK_TRUSTEES: Trustee[] = [
    { id: 'tr-01', name: 'أبو أحمد (خال)', relation: 'أقارب', phone: '0501122334', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', username: 'ahmed', password: '123' },
    { id: 'tr-02', name: 'صديق الطفولة سامي', relation: 'أصدقاء', phone: '0505566778', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sami', username: 'sami', password: '123' },
];

export const MOCK_TRUST_TRANSACTIONS: TrustTransaction[] = [
    { id: 'tt-01', trusteeId: 'tr-01', type: 'Deposit', amount: 50000, date: '2024-01-15', notes: 'إيداع مبلغ لحفظه لشراء أرض' },
    { id: 'tt-02', trusteeId: 'tr-02', type: 'Deposit', amount: 10000, date: '2024-02-01', notes: 'أمانة سفر' },
];

export const MOCK_INVESTORS: Investor[] = [
    { 
        id: 'inv-01', name: 'الشيخ محمد العبدالله', type: 'Capital', 
        agreementDetails: 'شريك ممول بنسبة 30% من صافي أرباح الشركة السنوية', 
        profitPercentage: 30,
        phone: '0501239999', email: 'mohammed@invest.com', joinDate: '2023-01-01',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Investor1',
        username: 'investor1', password: '123'
    },
    { 
        id: 'inv-02', name: 'م. سالم (شريك تنفيذي)', type: 'Partner', 
        agreementDetails: 'شريك بالجهد (الإدارة الهندسية) - نسبة 15% من أرباح مشاريع التنفيذ المتفق عليها', 
        linkedProjectIds: ['101', '104'],
        phone: '0504568888', email: 'salem@noah.com', joinDate: '2023-06-01',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salem',
        username: 'salem', password: '123'
    }
];

export const MOCK_INVESTOR_TRANSACTIONS: InvestorTransaction[] = [
    { id: 'it-01', investorId: 'inv-01', type: 'Capital_Injection', amount: 500000, date: '2023-01-05', notes: 'إيداع رأس مال تأسيسي (نقدي)' },
    { id: 'it-02', investorId: 'inv-01', type: 'Profit_Distribution', amount: 50000, date: '2023-12-31', notes: 'توزيع أرباح الربع الرابع 2023' },
];

export const MOCK_EMPLOYEES: Employee[] = [
    { id: 'emp-01', name: 'م. فهد السالم', role: 'مدير مشاريع', type: EmployeeType.STAFF, department: 'الهندسة', salary: 15000, phone: '0501111111', email: 'fahad@noah.com', joinDate: '2022-01-01', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fahad', username: 'fahad', password: '123', pettyCashBalance: 500 },
    { id: 'emp-02', name: 'سناء المالي', role: 'مديرة مالية', type: EmployeeType.STAFF, department: 'المالية', salary: 12000, phone: '0502222222', email: 'sana@noah.com', joinDate: '2022-03-15', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sana', username: 'sana', password: '123', pettyCashBalance: 200 },
    { id: 'crf-01', name: 'أبو محمد النجار', role: 'نجار مباني', type: EmployeeType.CRAFTSMAN, department: 'التنفيذ', salary: 4500, phone: '0505555555', email: '', joinDate: '2023-02-01', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carpenter1', username: 'wood', password: '123' },
    { id: 'wrk-01', name: 'كومار', role: 'عامل بناء', type: EmployeeType.WORKER, department: 'التنفيذ', salary: 2500, phone: '0508888888', email: '', joinDate: '2023-06-01', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kumar', username: 'kumar', password: '123' },
];

export const MOCK_PROJECTS: Project[] = [
    { 
        id: '101', 
        name: 'برج الأفق السكني', 
        clientName: 'شركة الأفق العقارية', 
        clientUsername: 'horizon', 
        clientId: 'c1', 
        budget: 5000000, 
        location: 'الرياض - العليا', 
        status: ProjectStatus.EXECUTION, 
        type: ProjectType.EXECUTION, 
        progress: 35, 
        startDate: '2023-06-01', 
        revenue: 1500000, 
        expenses: 800000, 
        workshopBalance: 15000, 
        workshopThreshold: 20000, 
        contractType: ContractType.LUMP_SUM, 
        agreedLaborBudget: 500000,
        statementColumns: [
            { id: 'item', label: 'البيان / البند', type: 'text' },
            { id: 'paid', label: 'المصاريف المدفوعة', type: 'number' },
            { id: 'agreed', label: 'المتفق عليه', type: 'number' },
            { id: 'expected', label: 'المتوقع (التقديري)', type: 'number' },
            { id: 'notes', label: 'ملاحظات', type: 'text' },
        ],
        statementRows: [
            { id: 'stm-1', item: 'أجور عامل الكهرباء', paid: 12000, agreed: 40000, expected: 40000, notes: 'تم دفع دفعة أولى' },
            { id: 'stm-2', item: 'مواد الكهرباء', paid: 35000, agreed: 120000, expected: 115000, notes: 'شراء كابلات وقواطع' },
        ]
    },
    { id: '102', name: 'تصميم داخلي للعيادة', clientName: 'د. خالد العتيبي', clientUsername: 'khalid', clientId: 'c2', budget: 150000, location: 'جدة - التحلية', status: ProjectStatus.DESIGN, type: ProjectType.DESIGN, progress: 80, startDate: '2024-01-10', revenue: 50000, expenses: 10000, contractType: ContractType.PERCENTAGE, companyPercentage: 15 },
    { id: '103', name: 'فيلا سارة المودرن', clientName: 'سارة الأحمد', clientUsername: 'sara', clientId: 'c3', budget: 2200000, location: 'الرياض - النرجس', status: ProjectStatus.PROPOSED, type: ProjectType.EXECUTION, progress: 0, startDate: '2024-06-01', revenue: 0, expenses: 0 },
    { id: '104', name: 'مستودعات الراجحي', clientName: 'مجموعة الراجحي للمقاولات', clientUsername: 'alrajhi', clientId: 'c4', budget: 850000, location: 'الدمام - الصناعية', status: ProjectStatus.EXECUTION, type: ProjectType.EXECUTION, progress: 60, startDate: '2023-09-01', revenue: 400000, expenses: 300000, workshopBalance: 5000, workshopThreshold: 5000 },
];

export const MOCK_INVOICES: Invoice[] = [
    { 
        id: 'inv-01', 
        invoiceNumber: 'INV-2024-001', 
        date: '2024-05-01', 
        projectId: '101', 
        supplierName: 'مصنع اليمامة',
        status: 'Paid',
        items: [
            { id: 'i1', description: 'حديد تسليح 12مم', unit: 'طن', quantity: 10, unitPrice: 3000, total: 30000 },
        ],
        subtotal: 30000,
        discount: 0,
        totalAmount: 30000,
        amount: 30000,
        type: InvoiceType.PURCHASE,
        category: 'مواد بناء'
    },
];

// Receipts: 1000+, Payments: 5000+, Transfers: 9000+
export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'txn-01', serialNumber: 1001, type: TransactionType.RECEIPT, date: '2024-05-01', amount: 150000, currency: 'USD', description: 'استلام دفعة مشروع البرج (نقدي)', projectId: '101', fromAccount: 'شركة الأفق', toAccount: 'الخزينة الرئيسية', status: 'Completed' },
    { id: 'txn-04', serialNumber: 1002, type: TransactionType.RECEIPT, date: '2024-05-07', amount: 25000, currency: 'USD', description: 'دفعة تصميم العيادة', projectId: '102', fromAccount: 'د. خالد', toAccount: 'الخزينة الرئيسية', status: 'Completed' },
    
    { id: 'txn-02', serialNumber: 5001, type: TransactionType.PAYMENT, date: '2024-05-05', amount: 50000, currency: 'USD', description: 'شراء حديد', projectId: '101', fromAccount: 'الخزينة الرئيسية', toAccount: 'مصنع اليمامة', status: 'Completed' },
    { id: 'txn-03', serialNumber: 5002, type: TransactionType.PAYMENT, date: '2024-05-06', amount: 5000, currency: 'USD', description: 'عهدة مشروع المستودعات', projectId: '104', fromAccount: 'الخزينة الرئيسية', toAccount: 'صندوق الورشة', status: 'Completed' },
    { id: 'txn-08', serialNumber: 5003, type: TransactionType.PAYMENT, date: '2024-05-20', amount: 15000, currency: 'USD', description: 'دفعة نجار', projectId: '101', fromAccount: 'الخزينة الرئيسية', toAccount: 'أبو محمد النجار', recipientId: 'crf-01', recipientType: 'Craftsman', status: 'Completed' },
    { id: 'txn-09', serialNumber: 5004, type: TransactionType.PAYMENT, date: '2024-05-22', amount: 4000, currency: 'USD', description: 'شراء قرطاسية مكتب', projectId: 'General', fromAccount: 'الخزينة الرئيسية', toAccount: 'مكتبة جرير', status: 'Completed' },
    
    { id: 'txn-10', serialNumber: 9001, type: TransactionType.TRANSFER, date: '2024-05-25', amount: 10000, currency: 'USD', description: 'تعزيز صندوق الورشة', projectId: '101', fromAccount: 'الخزينة الرئيسية', toAccount: 'صندوق الورشة', status: 'Completed' },
];

export const MOCK_SYP_TRANSACTIONS: Transaction[] = [
    { id: 'syp-01', type: TransactionType.PAYMENT, date: '2024-05-01', amount: 250000, currency: 'SYP', description: 'ضيافة وشاي', fromAccount: 'الصندوق اليومي', toAccount: 'سوبر ماركت', status: 'Completed' },
    { id: 'syp-03', type: TransactionType.RECEIPT, date: '2024-05-05', amount: 2000000, currency: 'SYP', description: 'صرف 200 دولار', fromAccount: 'مكتب الصرافة', toAccount: 'الصندوق اليومي', status: 'Completed' },
];

export const MOCK_PAYROLL: PayrollRecord[] = [
    { 
        id: 'pay-01', 
        employeeId: 'emp-01', 
        employeeName: 'م. فهد السالم', 
        month: 'أبريل', 
        year: 2024, 
        basicSalary: 15000, 
        allowanceList: [{ name: 'بدل سكن', amount: 1500 }], 
        deductionList: [], 
        netSalary: 16500, 
        status: 'Paid', 
        paymentDate: '2024-04-28' 
    },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
    { id: 'att-01', employeeId: 'emp-01', date: YESTERDAY, clockIn: '08:00', clockOut: '17:00', status: 'Present', totalHours: 9 },
    { id: 'att-07', employeeId: 'emp-01', date: TODAY, clockIn: '08:05', status: 'Present' },
];

export const MOCK_DAILY_REPORTS: DailyReport[] = [
    { id: 'rep-01', employeeId: 'emp-01', employeeName: 'م. فهد السالم', date: YESTERDAY, status: 'Reviewed', completedTasks: [{ id: 't1', description: 'زيارة موقع البرج', isCompleted: true, managerRating: 5 }], planForTomorrow: [{ id: 'p1', description: 'اجتماع مع العميل', isPriority: true, isCompleted: false }] },
];

export const MOCK_FILES: ArchiveFile[] = [
    { id: 'f1', name: 'العقود والمستندات', type: 'folder', date: '2024-01-01' },
    { id: 'd1', name: 'عقد مشروع البرج.pdf', type: 'pdf', size: '2.4 MB', date: '2024-05-15', parentId: 'f1' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', title: 'تجاوز الميزانية', message: 'مشروع المجمع السكني يقترب من الحد الأقصى.', time: 'منذ 5 ساعات', type: 'warning', isRead: false },
    { id: 'n2', title: 'مشروع جديد', message: 'تم إضافة مشروع "فيلا سارة" بنجاح.', time: 'أمس', type: 'success', isRead: true },
];
