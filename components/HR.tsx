
import React, { useState, useMemo } from 'react';
import { Employee, PayrollRecord, AttendanceRecord, EmployeeType, Transaction, TransactionType, PayrollItem } from '../types';
import { MOCK_PAYROLL, MOCK_ATTENDANCE, MOCK_TRANSACTIONS } from '../constants';
import { formatCurrency } from '../services/dataService';
import { 
  UserPlus, DollarSign, Clock, CheckCircle, Search, Edit, 
  Trash2, UserCog, Hammer, HardHat, Plus, X, FileText, Key, Lock,
  CheckSquare, AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface HRProps {
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
}

const HR: React.FC<HRProps> = ({ employees, onUpdateEmployees }) => {
  // Tabs: 'staff', 'craftsmen', 'workers', 'payroll', 'attendance'
  const [activeTab, setActiveTab] = useState<'staff' | 'craftsmen' | 'workers' | 'payroll' | 'attendance'>('staff');
  
  // Data States
  const [payroll, setPayroll] = useState<PayrollRecord[]>(MOCK_PAYROLL);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Attendance Sub-Tab
  const [attendanceFilter, setAttendanceFilter] = useState<'Staff' | 'Worker'>('Staff');

  // Payroll Filter State
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(new Date().toLocaleString('ar-SA', { month: 'long' }));
  const [selectedPayrollYear, setSelectedPayrollYear] = useState<number>(new Date().getFullYear());

  // --- Employee Modal State ---
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({
    name: '', role: '', type: EmployeeType.STAFF, department: '', salary: 0, 
    phone: '', email: '', joinDate: new Date().toISOString().split('T')[0], status: 'Active',
    avatar: '', username: '', password: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // --- Payroll Modal State ---
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [currentPayrollRecord, setCurrentPayrollRecord] = useState<Partial<PayrollRecord>>({
      month: new Date().toLocaleString('ar-SA', { month: 'long' }),
      year: new Date().getFullYear(),
      allowanceList: [],
      deductionList: [],
      basicSalary: 0,
      netSalary: 0,
      status: 'Pending'
  });
  // Helper for adding allowance/deduction lines
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(0);
  const [itemType, setItemType] = useState<'allowance' | 'deduction'>('allowance');

  // --- Helpers ---
  const getEmployeesByType = (type: EmployeeType) => {
      return employees.filter(e => 
          e.type === type && 
          (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  };

  // --- Employee Actions ---
  const handleSaveEmployee = (e: React.FormEvent) => {
      e.preventDefault();
      // Validation
      if (!currentEmployee.name || !currentEmployee.role) {
          alert("يرجى تعبئة الحقول الأساسية");
          return;
      }

      if (isEditMode && currentEmployee.id) {
          onUpdateEmployees(employees.map(emp => emp.id === currentEmployee.id ? { ...emp, ...currentEmployee } as Employee : emp));
      } else {
          const newEmp = { 
              ...currentEmployee, 
              id: `emp-new-${Date.now()}`,
              avatar: currentEmployee.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentEmployee.name}`
          } as Employee;
          onUpdateEmployees([...employees, newEmp]);
      }
      setIsEmployeeModalOpen(false);
  };

  const openAddEmployee = (type: EmployeeType) => {
      setCurrentEmployee({
        name: '', role: '', type: type, department: '', salary: 0, 
        phone: '', email: '', joinDate: new Date().toISOString().split('T')[0], status: 'Active',
        avatar: '', username: '', password: ''
      });
      setIsEditMode(false);
      setIsEmployeeModalOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
      setCurrentEmployee(emp);
      setIsEditMode(true);
      setIsEmployeeModalOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
      if(confirm('هل أنت متأكد من حذف هذا السجل؟')) {
          onUpdateEmployees(employees.filter(e => e.id !== id));
      }
  };

  // --- Payroll Actions & Logic ---

  // 1. Filter Payroll by selected month/year
  const filteredPayroll = useMemo(() => {
      return payroll.filter(p => p.month === selectedPayrollMonth && p.year === selectedPayrollYear);
  }, [payroll, selectedPayrollMonth, selectedPayrollYear]);

  // 2. Calculate Totals
  const payrollSummary = useMemo(() => {
      const totalNet = filteredPayroll.reduce((sum, p) => sum + p.netSalary, 0);
      const totalPaid = filteredPayroll.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netSalary, 0);
      const totalPending = totalNet - totalPaid;
      return { totalNet, totalPaid, totalPending };
  }, [filteredPayroll]);

  const openAddPayroll = () => {
      setCurrentPayrollRecord({
        id: undefined,
        month: selectedPayrollMonth,
        year: selectedPayrollYear,
        allowanceList: [],
        deductionList: [],
        basicSalary: 0,
        netSalary: 0,
        status: 'Pending',
        employeeId: '',
        employeeName: ''
      });
      setIsPayrollModalOpen(true);
  };

  const openEditPayroll = (record: PayrollRecord) => {
      setCurrentPayrollRecord(JSON.parse(JSON.stringify(record))); // Deep copy
      setIsPayrollModalOpen(true);
  };

  const handlePayrollEmployeeChange = (empId: string) => {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
          setCurrentPayrollRecord(prev => ({
              ...prev,
              employeeId: emp.id,
              employeeName: emp.name,
              basicSalary: emp.salary,
              netSalary: emp.salary // Reset net salary initially
          }));
      }
  };

  const addItemToPayroll = () => {
      if (!newItemName || !newItemAmount) return;
      
      const newItem: PayrollItem = { name: newItemName, amount: newItemAmount };
      
      if (itemType === 'allowance') {
          setCurrentPayrollRecord(prev => ({ ...prev, allowanceList: [...(prev.allowanceList || []), newItem] }));
      } else {
          setCurrentPayrollRecord(prev => ({ ...prev, deductionList: [...(prev.deductionList || []), newItem] }));
      }
      setNewItemName('');
      setNewItemAmount(0);
  };

  const removeItemFromPayroll = (index: number, type: 'allowance' | 'deduction') => {
      if (type === 'allowance') {
          setCurrentPayrollRecord(prev => ({ ...prev, allowanceList: prev.allowanceList?.filter((_, i) => i !== index) }));
      } else {
          setCurrentPayrollRecord(prev => ({ ...prev, deductionList: prev.deductionList?.filter((_, i) => i !== index) }));
      }
  };

  const handleSavePayroll = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentPayrollRecord.employeeId) { alert("يرجى اختيار الموظف"); return; }

      // Calculate Net
      const totalAllowances = currentPayrollRecord.allowanceList?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const totalDeductions = currentPayrollRecord.deductionList?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const net = (currentPayrollRecord.basicSalary || 0) + totalAllowances - totalDeductions;

      // Handle Post-Payment Editing
      // If record was PAID and amount changed, we update it. 
      // In a real system, you might create a "Diff Transaction", but here we just update the record
      // allowing managers to add bonuses even after salary release.
      
      const finalRecord: PayrollRecord = {
          ...currentPayrollRecord as PayrollRecord,
          id: currentPayrollRecord.id || `pay-${Date.now()}`,
          netSalary: net,
          // Keep status as is (if editing a Paid record, keep it Paid unless manually changed?)
          // Usually if amount changes after payment, it remains 'Paid' but accounting needs adjustment.
          // For simplicity here: We update the record values.
      };

      if (currentPayrollRecord.id) {
          setPayroll(payroll.map(p => p.id === finalRecord.id ? finalRecord : p));
      } else {
          setPayroll([finalRecord, ...payroll]);
      }
      setIsPayrollModalOpen(false);
  };

  const handleMarkAsPaid = (id: string) => {
      const record = payroll.find(p => p.id === id);
      if (!record) return;

      if (confirm(`هل تريد تأكيد صرف راتب "${record.employeeName}" بقيمة ${formatCurrency(record.netSalary)}؟\nسيتم تسجيل سند صرف تلقائي.`)) {
          createSalaryTransaction(record);
          setPayroll(payroll.map(p => p.id === id ? { ...p, status: 'Paid', paymentDate: new Date().toISOString().split('T')[0] } : p));
          alert("تم اعتماد الصرف.");
      }
  };

  // 3. Bulk Payment Function
  const handleBulkPay = () => {
      const pendingRecords = filteredPayroll.filter(p => p.status === 'Pending');
      if (pendingRecords.length === 0) {
          alert("لا توجد رواتب معلقة للصرف في هذا الشهر.");
          return;
      }

      if (confirm(`هل أنت متأكد من صرف ${pendingRecords.length} رواتب معلقة بقيمة إجمالية ${formatCurrency(pendingRecords.reduce((sum, p) => sum + p.netSalary, 0))}؟`)) {
          const updatedPayroll = payroll.map(p => {
              if (p.status === 'Pending' && p.month === selectedPayrollMonth && p.year === selectedPayrollYear) {
                  createSalaryTransaction(p);
                  return { ...p, status: 'Paid', paymentDate: new Date().toISOString().split('T')[0] } as PayrollRecord;
              }
              return p;
          });
          setPayroll(updatedPayroll);
          alert("تم صرف جميع الرواتب المعلقة بنجاح.");
      }
  };

  // Helper to create transaction
  const createSalaryTransaction = (record: PayrollRecord) => {
      const newTransaction: Transaction = {
          id: `txn-salary-${record.id}-${Date.now()}`,
          type: TransactionType.PAYMENT,
          date: new Date().toISOString().split('T')[0],
          amount: record.netSalary,
          currency: 'USD',
          description: `رواتب شهر ${record.month} ${record.year} - ${record.employeeName}`,
          fromAccount: 'الخزينة الرئيسية',
          toAccount: record.employeeName,
          recipientId: record.employeeId,
          recipientName: record.employeeName,
          recipientType: 'Staff', 
          status: 'Completed',
          projectId: 'General'
      };
      MOCK_TRANSACTIONS.unshift(newTransaction);
  };

  // Auto-fill Payroll for Month if empty (Helper feature)
  const initializePayrollForMonth = () => {
      const existingIds = filteredPayroll.map(p => p.employeeId);
      const activeEmployees = employees.filter(e => e.status === 'Active');
      
      const newRecords: PayrollRecord[] = [];
      activeEmployees.forEach(emp => {
          if (!existingIds.includes(emp.id)) {
              newRecords.push({
                  id: `pay-${Date.now()}-${emp.id}`,
                  employeeId: emp.id,
                  employeeName: emp.name,
                  month: selectedPayrollMonth,
                  year: selectedPayrollYear,
                  basicSalary: emp.salary,
                  allowanceList: [],
                  deductionList: [],
                  netSalary: emp.salary,
                  status: 'Pending'
              });
          }
      });

      if (newRecords.length > 0) {
          setPayroll([...payroll, ...newRecords]);
      } else {
          alert("جميع الموظفين النشطين لديهم مسيرات رواتب لهذا الشهر بالفعل.");
      }
  };

  // --- Render Components ---

  const renderEmployeeCard = (emp: Employee) => (
      <div key={emp.id} className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-5 hover:shadow-md transition-all group relative flex flex-col h-full">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={() => openEditEmployee(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-dark-800 rounded-lg"><Edit size={16} /></button>
              <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-dark-800 rounded-lg"><Trash2 size={16} /></button>
          </div>
          <div className="flex items-center gap-4 mb-4">
              <img src={emp.avatar} alt={emp.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-dark-700" />
              <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">{emp.name}</h3>
                  <p className="text-primary-600 text-sm">{emp.role}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{emp.status === 'Active' ? 'نشط' : 'غير نشط'}</span>
              </div>
          </div>
          <div className="space-y-2 pt-3 border-t border-gray-50 dark:border-dark-800 text-sm flex-1">
               <div className="flex justify-between">
                   <span className="text-gray-500 dark:text-gray-400">الهاتف</span>
                   <span className="text-gray-800 dark:text-gray-200 font-medium" dir="ltr">{emp.phone}</span>
               </div>
               <div className="flex justify-between">
                   <span className="text-gray-500 dark:text-gray-400">
                       {emp.type === EmployeeType.WORKER ? 'الأجر اليومي' : 'الراتب'}
                   </span>
                   <span className="text-gray-800 dark:text-gray-200 font-bold">{formatCurrency(emp.salary)}</span>
               </div>
               {emp.type === EmployeeType.CRAFTSMAN && (
                   <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">التخصص</span>
                       <span className="text-gray-800 dark:text-gray-200">{emp.department || 'عام'}</span>
                   </div>
               )}
          </div>
          
          {/* Credentials Display */}
          {(emp.username || emp.password) && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1"><Key size={10} /> بيانات الدخول</p>
                  <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">اسم المستخدم: <span className="font-mono font-bold text-gray-800 dark:text-gray-200 select-all">{emp.username}</span></span>
                      <span className="text-gray-600 dark:text-gray-400">كلمة المرور: <span className="font-mono font-bold text-gray-800 dark:text-gray-200 select-all">{emp.password}</span></span>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الموارد البشرية</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة الكادر، الحرفيين، العمال، والرواتب</p>
        </div>
        
        {/* Dynamic Add Button based on Tab */}
        {['staff', 'craftsmen', 'workers'].includes(activeTab) && (
            <button 
              onClick={() => openAddEmployee(
                  activeTab === 'staff' ? EmployeeType.STAFF : 
                  activeTab === 'workers' ? EmployeeType.WORKER : EmployeeType.CRAFTSMAN
              )}
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <UserPlus size={20} />
              <span>
                  {activeTab === 'staff' ? 'إضافة موظف إداري' : 
                   activeTab === 'workers' ? 'إضافة عامل يومية' : 'إضافة حرفي/مورد'}
              </span>
            </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto gap-2">
         {[
             { id: 'staff', label: 'الكادر الإداري', icon: UserCog },
             { id: 'craftsmen', label: 'الحرفيين والموردين', icon: Hammer },
             { id: 'workers', label: 'عمال اليومية', icon: HardHat },
             { id: 'payroll', label: 'الرواتب', icon: DollarSign },
             { id: 'attendance', label: 'الدوام', icon: Clock },
         ].map(tab => {
             const Icon = tab.icon;
             return (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-1 justify-center ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
                >
                    <Icon size={18} />
                    {tab.label}
                </button>
             );
         })}
      </div>

      {/* SEARCH (Common for Employee Tabs) */}
      {['staff', 'craftsmen', 'workers'].includes(activeTab) && (
          <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
            <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="بحث بالاسم أو التخصص..."
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:bg-dark-950 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
      )}

      {/* 1. STAFF TAB */}
      {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
              {getEmployeesByType(EmployeeType.STAFF).map(renderEmployeeCard)}
              {getEmployeesByType(EmployeeType.STAFF).length === 0 && <div className="col-span-full text-center py-10 text-gray-400">لا يوجد موظفين مسجلين</div>}
          </div>
      )}

      {/* 2. CRAFTSMEN TAB */}
      {activeTab === 'craftsmen' && (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm mb-4">
                <p>هذا القسم يشمل الحرفيين (كهربائي، سباك..) بالإضافة إلى الأشخاص الذين يتم التعامل معهم لتوريد المواد.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
                {getEmployeesByType(EmployeeType.CRAFTSMAN).map(renderEmployeeCard)}
                {getEmployeesByType(EmployeeType.CRAFTSMAN).length === 0 && <div className="col-span-full text-center py-10 text-gray-400">لا يوجد حرفيين أو موردين مسجلين</div>}
            </div>
          </>
      )}

      {/* 3. WORKERS TAB */}
      {activeTab === 'workers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
              {getEmployeesByType(EmployeeType.WORKER).map(renderEmployeeCard)}
              {getEmployeesByType(EmployeeType.WORKER).length === 0 && <div className="col-span-full text-center py-10 text-gray-400">لا يوجد عمال يومية مسجلين</div>}
          </div>
      )}

      {/* 4. PAYROLL TAB (ENHANCED) */}
      {activeTab === 'payroll' && (
          <div className="space-y-6 animate-in fade-in">
             
             {/* 1. Month/Year Filter & Actions */}
             <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800">
                 <div className="flex items-end gap-3 w-full md:w-auto">
                     <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1">الشهر</label>
                         <select 
                            className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm font-bold w-32 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                            value={selectedPayrollMonth}
                            onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                         >
                             {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map(m => <option key={m} value={m}>{m}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1">السنة</label>
                         <input 
                            type="number" 
                            className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm font-bold w-24 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                            value={selectedPayrollYear}
                            onChange={(e) => setSelectedPayrollYear(Number(e.target.value))}
                         />
                     </div>
                     <button 
                        onClick={initializePayrollForMonth}
                        className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 px-4 py-2 rounded-lg text-xs font-bold h-[38px] transition-colors"
                        title="إنشاء مسير رواتب لجميع الموظفين لهذا الشهر"
                     >
                        تجهيز مسير الشهر
                     </button>
                 </div>

                 <div className="flex gap-2 w-full md:w-auto">
                     <button 
                        onClick={openAddPayroll}
                        className="flex-1 md:flex-none bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                     >
                        <Plus size={16} /> إضافة راتب فردي
                     </button>
                     <button 
                        onClick={handleBulkPay}
                        disabled={payrollSummary.totalPending <= 0}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                     >
                        <CheckSquare size={18} />
                        صرف الكل ({formatCurrency(payrollSummary.totalPending)})
                     </button>
                 </div>
             </div>

             {/* 2. Summary Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white dark:bg-dark-900 p-5 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-1">إجمالي الرواتب المستحقة</p>
                     <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(payrollSummary.totalNet)}</h3>
                 </div>
                 <div className="bg-white dark:bg-dark-900 p-5 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-1">تم صرفه</p>
                     <h3 className="text-2xl font-bold text-green-600">{formatCurrency(payrollSummary.totalPaid)}</h3>
                 </div>
                 <div className="bg-white dark:bg-dark-900 p-5 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-1">المتبقي للصرف</p>
                     <h3 className="text-2xl font-bold text-orange-600">{formatCurrency(payrollSummary.totalPending)}</h3>
                 </div>
             </div>

             {/* 3. Payroll Table */}
             <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 dark:border-dark-800 flex items-center gap-2">
                     <FileText size={18} className="text-gray-400" />
                     <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                         مسير رواتب: {selectedPayrollMonth} {selectedPayrollYear}
                     </h3>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-right">
                         <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                             <tr>
                                 <th className="px-6 py-4">الموظف</th>
                                 <th className="px-6 py-4">الراتب الأساسي</th>
                                 <th className="px-6 py-4">الإضافي والبدلات</th>
                                 <th className="px-6 py-4">الخصومات</th>
                                 <th className="px-6 py-4">الصافي</th>
                                 <th className="px-6 py-4">الحالة</th>
                                 <th className="px-6 py-4">الإجراء</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                             {filteredPayroll.map(record => (
                                 <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                     <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{record.employeeName}</td>
                                     <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatCurrency(record.basicSalary)}</td>
                                     <td className="px-6 py-4 text-green-600">+{formatCurrency(record.allowanceList.reduce((sum, item) => sum + item.amount, 0))}</td>
                                     <td className="px-6 py-4 text-red-600">-{formatCurrency(record.deductionList.reduce((sum, item) => sum + item.amount, 0))}</td>
                                     <td className="px-6 py-4 font-bold text-primary-700">{formatCurrency(record.netSalary)}</td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                             {record.status === 'Paid' ? 'تم الصرف' : 'معلق'}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 flex gap-2">
                                         {record.status === 'Pending' ? (
                                             <>
                                                <button onClick={() => handleMarkAsPaid(record.id)} className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded transition-colors" title="اعتماد وصرف">
                                                    <CheckCircle size={14} />
                                                </button>
                                                <button onClick={() => openEditPayroll(record)} className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-1.5 rounded transition-colors" title="تعديل">
                                                    <Edit size={14} />
                                                </button>
                                             </>
                                         ) : (
                                            <button 
                                                onClick={() => openEditPayroll(record)}
                                                className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-1.5 rounded text-xs flex items-center gap-1 font-bold transition-colors"
                                                title="تعديل أو إضافة مكافأة"
                                            >
                                                <Edit size={14} /> تعديل
                                            </button>
                                         )}
                                     </td>
                                 </tr>
                             ))}
                             {filteredPayroll.length === 0 && (
                                 <tr>
                                     <td colSpan={7} className="text-center py-12 text-gray-400">
                                         لا توجد سجلات رواتب لهذا الشهر. 
                                         <br/>
                                         <button onClick={initializePayrollForMonth} className="text-primary-600 hover:underline mt-2">اضغط هنا لإنشاء السجلات تلقائياً</button>
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
          </div>
      )}

      {/* 5. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
          <div className="space-y-4 animate-in fade-in">
              <div className="flex gap-2">
                  <button 
                    onClick={() => setAttendanceFilter('Staff')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${attendanceFilter === 'Staff' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-600 dark:bg-dark-800 dark:border-dark-700 dark:text-gray-400'}`}
                  >
                      الكادر الإداري
                  </button>
                  <button 
                    onClick={() => setAttendanceFilter('Worker')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${attendanceFilter === 'Worker' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300' : 'bg-white border-gray-200 text-gray-600 dark:bg-dark-800 dark:border-dark-700 dark:text-gray-400'}`}
                  >
                      عمال اليومية
                  </button>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
                     <h3 className="font-bold text-gray-800 dark:text-white">
                         سجل الحضور - {attendanceFilter === 'Staff' ? 'الموظفين' : 'العمال'}
                     </h3>
                     <span className="text-sm text-gray-500">{new Date().toLocaleDateString('ar-SA')}</span>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-right">
                         <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                             <tr>
                                 <th className="px-6 py-4">الاسم</th>
                                 <th className="px-6 py-4">التاريخ</th>
                                 <th className="px-6 py-4">وقت الحضور</th>
                                 <th className="px-6 py-4">وقت الانصراف</th>
                                 <th className="px-6 py-4">ساعات العمل</th>
                                 <th className="px-6 py-4">الحالة</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                             {attendance
                                .filter(record => {
                                    const emp = employees.find(e => e.id === record.employeeId);
                                    // Match filter: Staff matches STAFF, Worker matches WORKER or CRAFTSMAN (if tracked)
                                    if (attendanceFilter === 'Staff') return emp?.type === EmployeeType.STAFF;
                                    return emp?.type === EmployeeType.WORKER;
                                })
                                .map(record => {
                                 const emp = employees.find(e => e.id === record.employeeId);
                                 return (
                                     <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                         <td className="px-6 py-4 flex items-center gap-3">
                                            <img src={emp?.avatar} className="w-8 h-8 rounded-full" alt="" />
                                            <div>
                                                <span className="font-medium block">{emp?.name}</span>
                                                <span className="text-xs text-gray-400">{emp?.role}</span>
                                            </div>
                                         </td>
                                         <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{record.date}</td>
                                         <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{record.clockIn}</td>
                                         <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{record.clockOut || '-'}</td>
                                         <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{record.totalHours || '-'}</td>
                                         <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                 record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                 record.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                                                 'bg-red-100 text-red-700'
                                             }`}>
                                                 {record.status === 'Present' ? 'حاضر' : record.status === 'Late' ? 'متأخر' : 'غائب'}
                                             </span>
                                         </td>
                                     </tr>
                                 );
                             })}
                         </tbody>
                     </table>
                 </div>
              </div>
          </div>
      )}

      {/* Add/Edit Employee Modal */}
      <Modal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} title={isEditMode ? "تعديل بيانات" : "إضافة جديد"}>
         <form onSubmit={handleSaveEmployee} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
                     <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:border-dark-700 dark:text-white" value={currentEmployee.name} onChange={e => setCurrentEmployee({...currentEmployee, name: e.target.value})} />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         {currentEmployee.type === EmployeeType.CRAFTSMAN ? 'التخصص (سباك/مورد..)' : 'المسمى الوظيفي'}
                     </label>
                     <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:border-dark-700 dark:text-white" value={currentEmployee.role} onChange={e => setCurrentEmployee({...currentEmployee, role: e.target.value})} />
                 </div>
             </div>
             
             {/* Hidden type input, handled by context */}
             
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         {currentEmployee.type === EmployeeType.WORKER ? 'الأجر اليومي المتفق عليه' : 'الراتب الأساسي'}
                     </label>
                     <input type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:border-dark-700 dark:text-white" value={currentEmployee.salary} onChange={e => setCurrentEmployee({...currentEmployee, salary: Number(e.target.value)})} />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                     <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:border-dark-700 dark:text-white" value={currentEmployee.phone} onChange={e => setCurrentEmployee({...currentEmployee, phone: e.target.value})} />
                 </div>
             </div>

             {/* Login Details Section */}
             <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-dark-700">
                 <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                     <Lock size={14} className="text-primary-600" />
                     بيانات الدخول للمنظومة
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">اسم المستخدم</label>
                         <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-dark-900 dark:border-dark-700 dark:text-white" 
                            placeholder="مثال: ahmed" 
                            value={currentEmployee.username} 
                            onChange={e => setCurrentEmployee({...currentEmployee, username: e.target.value})} 
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">كلمة المرور</label>
                         <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-dark-900 dark:border-dark-700 dark:text-white" 
                            placeholder="••••••" 
                            value={currentEmployee.password} 
                            onChange={e => setCurrentEmployee({...currentEmployee, password: e.target.value})} 
                         />
                     </div>
                 </div>
             </div>

             <div className="pt-2 flex gap-3">
                <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700">حفظ البيانات</button>
                <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
             </div>
         </form>
      </Modal>

      {/* Add/Edit Payroll Modal */}
      <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title={currentPayrollRecord.id ? "تعديل مسير راتب" : "إنشاء مسير راتب جديد"}>
          <form onSubmit={handleSavePayroll} className="space-y-4">
              
              {currentPayrollRecord.status === 'Paid' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-300 flex gap-2 items-center mb-2">
                      <AlertCircle size={16} />
                      تنبيه: هذا الراتب تم صرفه بالفعل. أي تعديل سيؤدي إلى تغيير القيم في السجلات ولكن لن يؤثر على السندات المحاسبية السابقة تلقائياً.
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <SearchableSelect 
                          label="الموظف"
                          options={employees.map(e => ({ value: e.id, label: e.name }))}
                          value={currentPayrollRecord.employeeId || ''}
                          onChange={handlePayrollEmployeeChange}
                          disabled={!!currentPayrollRecord.id}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">الشهر / السنة</label>
                      <div className="flex gap-2">
                          <select className="border rounded p-2 flex-1 dark:bg-dark-950 dark:text-white dark:border-dark-700" value={currentPayrollRecord.month} onChange={e => setCurrentPayrollRecord({...currentPayrollRecord, month: e.target.value})}>
                              {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input type="number" className="border rounded p-2 w-20 dark:bg-dark-950 dark:text-white dark:border-dark-700" value={currentPayrollRecord.year} onChange={e => setCurrentPayrollRecord({...currentPayrollRecord, year: Number(e.target.value)})} />
                      </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium mb-1">الراتب الأساسي</label>
                  <input type="number" className="w-full border rounded p-2 bg-gray-50 dark:bg-dark-800 dark:border-dark-700 dark:text-white" value={currentPayrollRecord.basicSalary} readOnly />
              </div>

              {/* Dynamic Additions/Deductions */}
              <div className="border-t dark:border-dark-700 pt-3">
                  <h4 className="font-bold text-sm mb-2 text-gray-800 dark:text-white">الإضافات والخصومات (مكافآت، بدلات، سلف..)</h4>
                  <div className="flex gap-2 mb-2">
                      <input placeholder="البيان (مثلاً: مكافأة تميز)" className="border rounded p-2 flex-1 text-sm dark:bg-dark-950 dark:text-white dark:border-dark-700" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                      <input type="number" placeholder="المبلغ" className="border rounded p-2 w-24 text-sm dark:bg-dark-950 dark:text-white dark:border-dark-700" value={newItemAmount} onChange={e => setNewItemAmount(Number(e.target.value))} />
                      <select className="border rounded p-2 text-sm dark:bg-dark-950 dark:text-white dark:border-dark-700" value={itemType} onChange={e => setItemType(e.target.value as any)}>
                          <option value="allowance">إضافة (+)</option>
                          <option value="deduction">خصم (-)</option>
                      </select>
                      <button type="button" onClick={addItemToPayroll} className="bg-primary-600 text-white p-2 rounded"><Plus size={16}/></button>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 dark:bg-dark-800 p-2 rounded custom-scrollbar">
                      {currentPayrollRecord.allowanceList?.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-1 rounded">
                              <span>+ {item.name}</span>
                              <div className="flex items-center gap-2">
                                  <span>{item.amount}</span>
                                  <X size={12} className="cursor-pointer" onClick={() => removeItemFromPayroll(i, 'allowance')}/>
                              </div>
                          </div>
                      ))}
                      {currentPayrollRecord.deductionList?.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1 rounded">
                              <span>- {item.name}</span>
                              <div className="flex items-center gap-2">
                                  <span>{item.amount}</span>
                                  <X size={12} className="cursor-pointer" onClick={() => removeItemFromPayroll(i, 'deduction')}/>
                              </div>
                          </div>
                      ))}
                      {(!currentPayrollRecord.allowanceList?.length && !currentPayrollRecord.deductionList?.length) && <p className="text-center text-gray-400 text-xs">لا توجد إضافات أو خصومات</p>}
                  </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded flex justify-between items-center font-bold">
                  <span className="text-gray-800 dark:text-white">صافي الراتب المستحق:</span>
                  <span className="text-xl text-blue-700 dark:text-blue-300">
                      {formatCurrency(
                          (currentPayrollRecord.basicSalary || 0) + 
                          (currentPayrollRecord.allowanceList?.reduce((a, b) => a + b.amount, 0) || 0) - 
                          (currentPayrollRecord.deductionList?.reduce((a, b) => a + b.amount, 0) || 0)
                      )}
                  </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700">حفظ التعديلات</button>
                <button type="button" onClick={() => setIsPayrollModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
             </div>
          </form>
      </Modal>
    </div>
  );
};

export default HR;
