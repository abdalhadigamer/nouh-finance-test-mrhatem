
import { Project, ProjectStatus, ProjectType, Invoice, InvoiceType, Transaction, TransactionType, User, UserRole, Client, Employee, EmployeeType, PayrollRecord, AttendanceRecord, DailyReport, ArchiveFile, Notification } from './types';

// Helper to get today's date in YYYY-MM-DD format (Local)
const getTodayDate = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const TODAY = getTodayDate();

export const LOGO_URL = 'https://cdn-icons-png.flaticon.com/512/1048/1048927.png';

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'أحمد المدير', 
    role: UserRole.GENERAL_MANAGER, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', 
    email: 'admin@noah.com' 
  },
  { 
    id: '2', 
    name: 'سارة المالية', 
    role: UserRole.FINANCE_MANAGER, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 
    email: 'finance@noah.com' 
  },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'الشيخ عبدالله',
    companyName: 'مجموعة القابضة',
    phone: '0555123456',
    email: 'abdullah@vip.com',
    username: 'vip_user',
    password: 'vip',
    joinDate: '2023-01-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah'
  },
  {
    id: 'c2',
    name: 'د. محمد العتيبي',
    companyName: 'مستشفى الأمل',
    phone: '0500987654',
    email: 'dr.mohammed@clinic.com',
    username: 'client101',
    password: '123',
    joinDate: '2023-10-05',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed'
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: '101',
    name: 'فيلا السليمانية',
    clientName: 'د. محمد العتيبي',
    budget: 1500000, 
    estimatedCost: 1100000, 
    location: 'الرياض - السليمانية',
    status: ProjectStatus.EXECUTION,
    type: ProjectType.EXECUTION,
    progress: 45,
    startDate: '2023-11-01',
    revenue: 600000,
    expenses: 450000,
    clientUsername: 'client101',
    clientPassword: '123',
    // Workshop Fund Example: Low balance
    workshopBalance: 2500, 
    workshopThreshold: 5000,
    agreements: [
      { id: 'agr-01', employeeId: 'crf-01', title: 'اتفاقية أعمال نجارة كاملة', amount: 45000, date: '2023-11-15', attachmentUrl: '' },
      { id: 'agr-02', employeeId: 'crf-02', title: 'تأسيس كهرباء الدور الأرضي', amount: 12000, date: '2023-12-01' }
    ],
    notes: [
      { id: 'note-01', content: 'تم تغيير مواصفات الرخام بناء على طلب العميل', date: '2024-01-10', author: 'م. فهد السالم' },
      { id: 'note-02', content: 'يجب مراجعة مخططات التكييف قبل البدء بالجبس', date: '2024-02-05', author: 'م. فهد السالم' }
    ]
  },
  {
    id: '102',
    name: 'تصميم مكتب المحاماة',
    clientName: 'شركة النخبة',
    budget: 250000, 
    estimatedCost: 80000, 
    companyPercentage: 15, 
    location: 'جدة - التحلية',
    status: ProjectStatus.DESIGN,
    type: ProjectType.DESIGN,
    progress: 80,
    startDate: '2024-01-15',
    revenue: 100000,
    expenses: 20000,
    clientUsername: 'client102',
    clientPassword: '123',
    agreements: [],
    notes: []
  },
  {
    id: '201',
    name: 'قصر الضيافة - حي النرجس',
    clientName: 'الشيخ عبدالله',
    budget: 3500000,
    estimatedCost: 2800000,
    location: 'الرياض - النرجس',
    status: ProjectStatus.EXECUTION,
    type: ProjectType.EXECUTION,
    progress: 65,
    startDate: '2023-05-01',
    revenue: 2000000,
    expenses: 1800000,
    clientUsername: 'vip_user',
    clientPassword: 'vip',
    // Workshop Fund Example: Good balance
    workshopBalance: 150000, 
    workshopThreshold: 10000,
    agreements: [
        { id: 'agr-03', employeeId: 'crf-01', title: 'ديكورات خشبية للمجالس', amount: 120000, date: '2023-06-01' }
    ],
    notes: []
  },
  {
    id: '202',
    name: 'تصميم ملحق خارجي ومسبح',
    clientName: 'الشيخ عبدالله',
    budget: 450000,
    estimatedCost: 150000,
    location: 'الرياض - النرجس',
    status: ProjectStatus.PROPOSED,
    type: ProjectType.DESIGN,
    progress: 0,
    startDate: '2024-06-01',
    revenue: 0,
    expenses: 0,
    clientUsername: 'vip_user',
    clientPassword: 'vip',
    agreements: [],
    notes: []
  }
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-001', invoiceNumber: 'INV-2024-001', date: '2024-05-20', projectId: '101', amount: 50000, type: InvoiceType.PURCHASE, category: 'مواد بناء (حديد)', status: 'Paid', supplierOrClient: 'مؤسسة الحديد المتين' },
  { id: 'inv-002', invoiceNumber: 'INV-2024-002', date: '2024-05-22', projectId: '102', amount: 25000, type: InvoiceType.SALES, category: 'دفعة أولى تصميم', status: 'Paid', supplierOrClient: 'شركة النخبة' },
  { id: 'inv-003', invoiceNumber: 'INV-2024-003', date: '2024-05-25', projectId: '101', amount: 12000, type: InvoiceType.SUPPLIER, category: 'أدوات كهربائية', status: 'Pending', supplierOrClient: 'توريدات الشرق' },
  { id: 'inv-emp-01', invoiceNumber: 'EXP-001', date: TODAY, projectId: '101', amount: 150, type: InvoiceType.PURCHASE, category: 'ضيافة موقع', status: 'Paid', supplierOrClient: 'سعيد العمري', relatedEmployeeId: 'emp-03' },
  
  // Ledger Data for Craftsman (Mohammed Carpenter crf-01)
  { id: 'inv-crf-101', invoiceNumber: 'WORK-001', date: '2024-05-10', projectId: '101', amount: 15000, type: InvoiceType.PURCHASE, category: 'تركيب أبواب خشبية', status: 'Paid', supplierOrClient: 'محمد النجار', relatedEmployeeId: 'crf-01' },
  { id: 'inv-crf-102', invoiceNumber: 'WORK-002', date: '2024-05-15', projectId: '201', amount: 25000, type: InvoiceType.PURCHASE, category: 'أعمال ديكور خشبي للمجلس', status: 'Pending', supplierOrClient: 'محمد النجار', relatedEmployeeId: 'crf-01' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'txn-01', type: TransactionType.RECEIPT, date: '2024-05-22', amount: 25000, currency: 'USD', description: 'استلام دفعة مشروع المكتب', projectId: '102', fromAccount: 'العميل', toAccount: 'البنك - الأهلي', status: 'Completed', actualPaymentDate: '2024-05-22' },
  { id: 'txn-02', type: TransactionType.PAYMENT, date: '2024-05-20', amount: 50000, currency: 'USD', description: 'شراء حديد تسليح', projectId: '101', fromAccount: 'البنك - الراجحي', toAccount: 'مؤسسة الحديد المتين', status: 'Completed', actualPaymentDate: '2024-05-20' },
  
  // Ledger Transactions for Craftsman (Mohammed Carpenter crf-01)
  // Payment for Project 101
  { id: 'txn-crf-01', type: TransactionType.PAYMENT, date: '2024-05-12', amount: 5000, currency: 'USD', description: 'دفعة أولى أبواب', projectId: '101', fromAccount: 'الخزينة الرئيسية', toAccount: 'محمد النجار', recipientId: 'crf-01', recipientType: 'Craftsman', status: 'Completed', actualPaymentDate: '2024-05-12' },
  { id: 'txn-crf-02', type: TransactionType.PAYMENT, date: '2024-05-25', amount: 5000, currency: 'USD', description: 'دفعة ثانية أبواب', projectId: '101', fromAccount: 'الخزينة الرئيسية', toAccount: 'محمد النجار', recipientId: 'crf-01', recipientType: 'Craftsman', status: 'Completed', actualPaymentDate: '2024-05-25' },
  // Payment for Project 201
  { id: 'txn-crf-03', type: TransactionType.PAYMENT, date: '2024-05-28', amount: 10000, currency: 'USD', description: 'دفعة مقدمة ديكور', projectId: '201', fromAccount: 'الخزينة الرئيسية', toAccount: 'محمد النجار', recipientId: 'crf-01', recipientType: 'Craftsman', status: 'Completed', actualPaymentDate: '2024-05-28' },
  
  // Example of Pending Settlement (Workshop Expense)
  { id: 'txn-pend-01', type: TransactionType.PAYMENT, date: TODAY, amount: 200, currency: 'USD', description: 'نثريات موقع (دهانات)', projectId: '101', fromAccount: 'صندوق الورشة', toAccount: 'مواد بناء', status: 'Pending_Settlement' }
];

export const MOCK_SYP_TRANSACTIONS: Transaction[] = [
  { id: 'syp-01', type: TransactionType.PAYMENT, date: '2024-05-28', amount: 150000, currency: 'SYP', description: 'شراء قرطاسية للمكتب', fromAccount: 'الصندوق اليومي', toAccount: 'مكتبة النور', status: 'Completed', actualPaymentDate: '2024-05-28' },
  { id: 'syp-02', type: TransactionType.PAYMENT, date: '2024-05-29', amount: 500000, currency: 'SYP', description: 'صيانة مكيفات', fromAccount: 'الصندوق اليومي', toAccount: 'ورشة التبريد', status: 'Completed', actualPaymentDate: '2024-05-29' },
  { id: 'syp-03', type: TransactionType.RECEIPT, date: '2024-05-30', amount: 2000000, currency: 'SYP', description: 'مبيعات نقدية صغيرة', fromAccount: 'زبون خارجي', toAccount: 'الصندوق اليومي', status: 'Completed', actualPaymentDate: '2024-05-30' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  // STAFF
  { 
    id: 'emp-01', name: 'م. فهد السالم', role: 'مدير مشاريع', type: EmployeeType.STAFF, department: 'الهندسة', salary: 12000, phone: '0501111111', email: 'fahad@noah.com', joinDate: '2022-01-10', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fahad',
    username: 'fahad', password: '123', pettyCashBalance: 0
  },
  { 
    id: 'emp-02', name: 'علي حسن', role: 'محاسب عام', type: EmployeeType.STAFF, department: 'المالية', salary: 7000, phone: '0502222222', email: 'ali@noah.com', joinDate: '2023-03-15', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali',
    username: 'ali', password: '123', pettyCashBalance: 0
  },
  { 
    id: 'emp-03', name: 'سعيد العمري', role: 'مندوب مشتريات', type: EmployeeType.STAFF, department: 'المشتريات', salary: 5500, phone: '0503333333', email: 'saeed@noah.com', joinDate: '2023-06-01', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Saeed',
    username: 'saeed', password: '123', pettyCashBalance: 500 
  },
  // CRAFTSMEN
  { 
    id: 'crf-01', name: 'محمد النجار', role: 'نجار مباني', type: EmployeeType.CRAFTSMAN, department: 'التنفيذ', salary: 4500, phone: '0599999991', email: '-', joinDate: '2023-08-01', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carpenter',
    username: 'mohammed', password: '123', pettyCashBalance: 0
  },
  { 
    id: 'crf-02', name: 'جابر الكهربائي', role: 'فني كهرباء', type: EmployeeType.CRAFTSMAN, department: 'التنفيذ', salary: 4800, phone: '0599999992', email: '-', joinDate: '2023-09-01', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jaber',
    username: 'jaber', password: '123', pettyCashBalance: 0
  },
  // WORKERS
  { 
    id: 'wrk-01', name: 'كومار', role: 'عامل بناء', type: EmployeeType.WORKER, department: 'التنفيذ', salary: 2500, phone: '0588888881', email: '-', joinDate: '2024-01-01', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kumar',
    username: 'kumar', password: '123', pettyCashBalance: 0
  },
];

export const MOCK_PAYROLL: PayrollRecord[] = [
  { id: 'pay-01', employeeId: 'emp-01', employeeName: 'م. فهد السالم', month: 'مايو', year: 2024, basicSalary: 12000, allowances: 2000, deductions: 0, netSalary: 14000, status: 'Paid', paymentDate: '2024-05-27' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-01', employeeId: 'emp-01', date: TODAY, clockIn: '08:00', clockOut: '17:00', status: 'Present', totalHours: 9 },
  { id: 'att-03', employeeId: 'emp-03', date: TODAY, clockIn: '09:00', status: 'Present' },
];

export const MOCK_DAILY_REPORTS: DailyReport[] = [
  {
    id: 'rep-01',
    employeeId: 'emp-01',
    employeeName: 'م. فهد السالم',
    date: TODAY,
    status: 'Reviewed',
    completedTasks: [
      { id: 't1', description: 'زيارة موقع السليمانية', isCompleted: true, managerRating: 5, managerComment: 'ممتاز' },
    ],
    planForTomorrow: [
      { id: 'p1', description: 'مراجعة جداول الكميات', isCompleted: false, isPriority: true },
    ]
  },
];

export const MOCK_FILES: ArchiveFile[] = [
  { id: 'f1', name: 'العقود والمستندات', type: 'folder', date: '2024-01-01' },
  { id: 'f2', name: 'المخططات الهندسية', type: 'folder', date: '2024-01-01' },
  { id: 'f3', name: 'فواتير 2024', type: 'folder', date: '2024-01-01' },
  { id: 'd1', name: 'عقد مشروع السليمانية.pdf', type: 'pdf', size: '2.4 MB', date: '2024-05-15', parentId: 'f1' },
  { id: 'd2', name: 'مخطط الدور الأرضي.png', type: 'image', size: '5.1 MB', date: '2024-05-20', parentId: 'f2' },
  { id: 'd3', name: 'جدول الكميات.xlsx', type: 'excel', size: '1.2 MB', date: '2024-06-01', parentId: 'f1' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'فاتورة مستحقة الدفع', message: 'فاتورة مشروع السليمانية رقم INV-003 تستحق الدفع غداً.', time: 'منذ ساعتين', type: 'error', isRead: false },
  { id: 'n2', title: 'تجاوز الميزانية', message: 'مشروع المجمع السكني يقترب من الحد الأقصى للمصاريف.', time: 'منذ 5 ساعات', type: 'warning', isRead: false },
  { id: 'n3', title: 'مشروع جديد', message: 'تم إضافة مشروع "تصميم ملحق خارجي" بنجاح.', time: 'أمس', type: 'success', isRead: true },
  { id: 'n4', title: 'طلب إجازة', message: 'قدم الموظف علي حسن طلب إجازة لمدة يومين.', time: 'أمس', type: 'info', isRead: true },
  { id: 'n5', title: 'تحديث النظام', message: 'تم تحديث النظام إلى النسخة 2.0 بنجاح.', time: 'منذ يومين', type: 'info', isRead: true },
];
