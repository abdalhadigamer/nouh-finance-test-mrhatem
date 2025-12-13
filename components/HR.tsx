import React, { useState } from 'react';
import { MOCK_PAYROLL, MOCK_INVOICES, MOCK_TRANSACTIONS, MOCK_PROJECTS } from '../constants';
import { Employee, PayrollRecord, AppDocument, EmployeeType, Invoice, Transaction, TransactionType, LedgerEntry } from '../types';
import { formatCurrency } from '../services/dataService';
import { Users, Phone, Mail, Clock, FileText, Search, CreditCard, Wallet, Plus, Key, CheckCircle, Upload, Paperclip, X, Hammer, Briefcase, HardHat, ArrowRight, BookOpen, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Modal from './Modal';

interface HRProps {
  employees: Employee[];
  onUpdateEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const HR: React.FC<HRProps> = ({ employees, onUpdateEmployees }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'craftsmen' | 'workers' | 'payroll'>('staff');
  const [payroll, setPayroll] = useState<PayrollRecord[]>(MOCK_PAYROLL);
  const [searchTerm, setSearchTerm] = useState('');

  // Ledger State
  const [selectedCraftsman, setSelectedCraftsman] = useState<Employee | null>(null);

  // Add/Edit Employee Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '', role: '', type: EmployeeType.STAFF, department: '', salary: 0, phone: '', email: '', status: 'Active', pettyCashBalance: 0, username: '', password: '', documents: []
  });

  const getFilteredEmployees = () => {
    let type = EmployeeType.STAFF;
    if (activeTab === 'craftsmen') type = EmployeeType.CRAFTSMAN;
    if (activeTab === 'workers') type = EmployeeType.WORKER;

    return employees.filter(e => 
      e.type === type && 
      (e.name.includes(searchTerm) || e.role.includes(searchTerm))
    );
  };

  const openAddModal = () => {
    let defaultType = EmployeeType.STAFF;
    if (activeTab === 'craftsmen') defaultType = EmployeeType.CRAFTSMAN;
    if (activeTab === 'workers') defaultType = EmployeeType.WORKER;

    setFormData({
      name: '', role: '', type: defaultType, department: '', salary: 0, phone: '', email: '', status: 'Active', pettyCashBalance: 0, username: '', password: '', documents: []
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && formData.id) {
      const updatedEmployees = employees.map(emp => 
        emp.id === formData.id ? { ...emp, ...formData } as Employee : emp
      );
      onUpdateEmployees(updatedEmployees);
    } else {
      const emp: Employee = {
        ...formData as Employee,
        id: `emp-${Date.now()}`,
        joinDate: new Date().toISOString().split('T')[0],
        avatar: formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
        username: formData.username || `user${Date.now()}`,
        password: formData.password || '123'
      };
      onUpdateEmployees([emp, ...employees]);
    }
    setIsModalOpen(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        setFormData({ ...formData, avatar: imageUrl });
    }
  };

  // Helper to get financials for a specific craftsman
  const getCraftsmanFinancials = (craftsmanId: string) => {
      // 1. Get all Invoices (Work Done)
      const workDone = MOCK_INVOICES.filter(inv => inv.relatedEmployeeId === craftsmanId);
      
      // 2. Get all Payments Received (Transactions)
      const payments = MOCK_TRANSACTIONS.filter(txn => 
        txn.recipientId === craftsmanId && txn.type === TransactionType.PAYMENT
      );

      // 3. Group by Project
      // Define a structure for the project info needed
      type ProjectSummary = { id: string; name: string; location: string };
      
      const projectMap = new Map<string, {
          project: ProjectSummary, 
          entries: LedgerEntry[],
          totalWork: number,
          totalPaid: number
      }>();

      // Process Invoices
      workDone.forEach(inv => {
          const pid = inv.projectId;
          if (!projectMap.has(pid)) {
              const foundProject = MOCK_PROJECTS.find(p => p.id === pid);
              const projInfo: ProjectSummary = foundProject 
                ? { id: foundProject.id, name: foundProject.name, location: foundProject.location } 
                : { id: pid, name: `مشروع #${pid}`, location: '-' };
                
              projectMap.set(pid, { project: projInfo, entries: [], totalWork: 0, totalPaid: 0 });
          }
          const entry = projectMap.get(pid)!;
          // Add as LedgerEntry
          entry.entries.push({ ...inv, rowType: 'invoice' });
          entry.totalWork += inv.amount;
      });

      // Process Payments
      payments.forEach(pay => {
          const pid = pay.projectId || 'General';
          if (!projectMap.has(pid)) {
             const foundProject = MOCK_PROJECTS.find(p => p.id === pid);
             const projInfo: ProjectSummary = foundProject
                ? { id: foundProject.id, name: foundProject.name, location: foundProject.location }
                : { id: pid, name: pid === 'General' ? 'عام' : `مشروع #${pid}`, location: '-' };

             projectMap.set(pid, { project: projInfo, entries: [], totalWork: 0, totalPaid: 0 });
          }
          const entry = projectMap.get(pid)!;
          // Add as LedgerEntry
          entry.entries.push({ ...pay, rowType: 'payment' });
          entry.totalPaid += pay.amount;
      });

      // Calculate Totals
      const totalWork = workDone.reduce((sum, i) => sum + i.amount, 0);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      // Sort entries by date for each project
      projectMap.forEach((value) => {
          value.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });

      return {
          projectBreakdown: Array.from(projectMap.values()),
          totalWork,
          totalPaid,
          balance: totalWork - totalPaid // Positive = Company owes Craftsman, Negative = Craftsman owes Company
      };
  };

  // --- LEDGER VIEW ---
  if (selectedCraftsman) {
      const financials = getCraftsmanFinancials(selectedCraftsman.id);
      
      return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Header */}
              <div className="flex items-center gap-4 bg-white dark:bg-dark-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                  <button 
                    onClick={() => setSelectedCraftsman(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                  >
                      <ArrowRight size={24} className="text-gray-600 dark:text-gray-300" />
                  </button>
                  <div className="flex items-center gap-3">
                      <img src={selectedCraftsman.avatar} alt="avatar" className="w-12 h-12 rounded-full border border-gray-200" />
                      <div>
                          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{selectedCraftsman.name}</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">كشف حساب الحرفي (تفصيلي حسب الورشة)</p>
                      </div>
                  </div>
              </div>

              {/* Global Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي الأعمال (الفواتير)</p>
                     <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(financials.totalWork)}</h3>
                 </div>
                 <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي المقبوضات (سندات الصرف)</p>
                     <h3 className="text-2xl font-bold text-green-600">{formatCurrency(financials.totalPaid)}</h3>
                 </div>
                 <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الرصيد المتبقي</p>
                     <h3 className={`text-2xl font-bold ${financials.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                         {formatCurrency(Math.abs(financials.balance))}
                         <span className="text-xs font-normal text-gray-400 mr-2">
                             {financials.balance > 0 ? '(له - مستحق)' : financials.balance < 0 ? '(عليه - فائض)' : '(خالص)'}
                         </span>
                     </h3>
                 </div>
              </div>

              {/* Breakdown by Project */}
              <div className="space-y-6">
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                      <Briefcase size={20} className="text-primary-600" />
                      تفاصيل الورش والمشاريع
                  </h3>
                  
                  {financials.projectBreakdown.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                          {/* Project Header */}
                          <div className="p-4 bg-gray-50 dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                              <div className="flex items-center gap-2">
                                  <div className="bg-white dark:bg-dark-700 p-2 rounded-lg text-primary-600">
                                      <Hammer size={18} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-800 dark:text-white">{item.project.name}</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.project.location}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                  <div className="text-center">
                                      <span className="text-xs text-gray-500 block">إنجاز</span>
                                      <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalWork)}</span>
                                  </div>
                                  <div className="text-center">
                                      <span className="text-xs text-gray-500 block">استلام</span>
                                      <span className="font-bold text-green-600">{formatCurrency(item.totalPaid)}</span>
                                  </div>
                                  <div className="bg-white dark:bg-dark-950 px-3 py-1 rounded-lg border border-gray-200 dark:border-dark-700">
                                      <span className="text-xs text-gray-500 block">المتبقي</span>
                                      <span className={`font-bold ${item.totalWork - item.totalPaid > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                          {formatCurrency(item.totalWork - item.totalPaid)}
                                      </span>
                                  </div>
                              </div>
                          </div>

                          {/* Combined Ledger Table */}
                          <div className="overflow-x-auto">
                              <table className="w-full text-sm text-right">
                                  <thead className="bg-white dark:bg-dark-900 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-800">
                                      <tr>
                                          <th className="px-6 py-3 font-medium">التاريخ</th>
                                          <th className="px-6 py-3 font-medium">البيان / الوصف</th>
                                          <th className="px-6 py-3 font-medium">النوع</th>
                                          <th className="px-6 py-3 font-medium">له (مستحق)</th>
                                          <th className="px-6 py-3 font-medium">عليه (مقبوض)</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                                      {item.entries.map((row) => (
                                          <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                              <td className="px-6 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{row.date}</td>
                                              <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">
                                                  {row.rowType === 'invoice' ? row.category : row.description}
                                              </td>
                                              <td className="px-6 py-3">
                                                  {row.rowType === 'invoice' ? (
                                                      <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                                                          <FileText size={10} /> فاتورة عمل
                                                      </span>
                                                  ) : (
                                                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                                                          <Wallet size={10} /> سند صرف
                                                      </span>
                                                  )}
                                              </td>
                                              <td className="px-6 py-3 font-bold text-gray-700 dark:text-gray-300">
                                                  {row.rowType === 'invoice' ? formatCurrency(row.amount) : '-'}
                                              </td>
                                              {/* Payments Received -> Blue */}
                                              <td className="px-6 py-3 font-bold text-blue-600">
                                                  {row.rowType === 'payment' ? formatCurrency(row.amount) : '-'}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  ))}
                  
                  {financials.projectBreakdown.length === 0 && (
                      <div className="bg-white dark:bg-dark-900 p-10 rounded-2xl border border-dashed border-gray-200 dark:border-dark-700 text-center text-gray-400">
                          لا توجد حركات مالية مسجلة لهذا الحرفي بعد.
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- MAIN LIST VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الموارد البشرية</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة الكوادر، الحرفيين، والعمالة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto">
         <button 
           onClick={() => setActiveTab('staff')}
           className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'staff' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <Briefcase size={18} />
           الكادر الإداري
         </button>
         <button 
           onClick={() => setActiveTab('craftsmen')}
           className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'craftsmen' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <Hammer size={18} />
           الحرفيين والمهنيين
         </button>
         <button 
           onClick={() => setActiveTab('workers')}
           className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'workers' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <HardHat size={18} />
           عمال اليومية
         </button>
         <button 
            onClick={() => setActiveTab('payroll')}
            className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'payroll' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <CreditCard size={18} />
           الرواتب
         </button>
      </div>

      {activeTab !== 'payroll' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="flex justify-between items-center gap-4 bg-white dark:bg-dark-900 p-4 rounded-2xl border border-gray-100 dark:border-dark-800">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="بحث..." 
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={openAddModal}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-500/20"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">إضافة جديد</span>
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {getFilteredEmployees().map(emp => (
               <div key={emp.id} className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden hover:shadow-lg transition-all group relative flex flex-col h-full">
                 <div className="p-6 flex items-start gap-4 flex-1">
                   <div className="relative">
                      <img src={emp.avatar} alt={emp.name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                      <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white dark:border-dark-900 flex items-center justify-center text-white text-[10px] ${emp.status === 'Active' ? 'bg-green-500' : 'bg-orange-500'}`}>
                        {emp.status === 'Active' ? '✓' : '!'}
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-gray-800 dark:text-white truncate text-lg">{emp.name}</h3>
                     <p className="text-primary-600 dark:text-primary-400 text-sm font-medium">{emp.role}</p>
                     <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><Briefcase size={12}/> {emp.department}</p>
                   </div>
                 </div>
                 
                 {/* Special Action for Craftsmen/Workers: View Ledger */}
                 {activeTab === 'craftsmen' && (
                     <div className="px-6 pb-2">
                        <button 
                           onClick={() => setSelectedCraftsman(emp)}
                           className="w-full py-2 bg-gray-50 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors border border-gray-100 dark:border-dark-700"
                        >
                            <BookOpen size={16} />
                            كشف الحساب والورش
                        </button>
                     </div>
                 )}

                 <div className="bg-gray-50 dark:bg-dark-800/50 p-4 border-t border-gray-100 dark:border-dark-800 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">الراتب / اليومية</p>
                        <p className="font-bold text-gray-700 dark:text-gray-200">{formatCurrency(emp.salary)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">العهدة الحالية</p>
                        <p className="font-bold text-gray-700 dark:text-gray-200">{formatCurrency(emp.pettyCashBalance || 0)}</p>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Modal logic remains similar, ensuring type selection is handled */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة بيانات">
        <form onSubmit={handleSaveEmployee} className="space-y-4">
             {/* Avatar Upload */}
             <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <Upload className="text-gray-400" />
                    )}
                    </div>
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-800 dark:border-dark-700" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النوع</label>
                    <select className="w-full px-4 py-2 border rounded-lg dark:bg-dark-800 dark:border-dark-700" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as EmployeeType})}>
                        <option value={EmployeeType.STAFF}>إداري/هندسي</option>
                        <option value={EmployeeType.CRAFTSMAN}>حرفي/مهني</option>
                        <option value={EmployeeType.WORKER}>عامل</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المسمى</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-800 dark:border-dark-700" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                </div>
            </div>

            <button type="submit" className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold">حفظ</button>
        </form>
      </Modal>
    </div>
  );
};

export default HR;