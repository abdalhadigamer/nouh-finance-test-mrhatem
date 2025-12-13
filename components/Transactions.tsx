
import React, { useEffect, useState } from 'react';
import { getRecentTransactions, formatCurrency } from '../services/dataService';
import { Transaction, TransactionType, EmployeeType } from '../types';
import { MOCK_EMPLOYEES, MOCK_PROJECTS } from '../constants';
import { 
  Download, PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCcw, 
  Paperclip, Check, Upload, Camera, Search, TrendingDown, TrendingUp, 
  HardHat, CheckCircle, Clock, Edit, FileText, Briefcase, X
} from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'revenues' | 'transfers'>('expenses');
  const [expenseSubTab, setExpenseSubTab] = useState<'completed' | 'pending'>('completed');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 

  const [newTxn, setNewTxn] = useState<Partial<Transaction>>({
    id: undefined,
    amount: 0,
    currency: 'USD',
    description: '',
    fromAccount: 'الخزينة الرئيسية',
    toAccount: '',
    type: TransactionType.PAYMENT,
    recipientType: 'Other',
    projectId: '',
    attachmentUrl: ''
  });

  // Settlement Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [txnToSettle, setTxnToSettle] = useState<Transaction | null>(null);
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settleFromAccount, setSettleFromAccount] = useState<string>('الخزينة الرئيسية');

  // State for HR Linking
  const [recipientCategory, setRecipientCategory] = useState<string>(''); 

  useEffect(() => {
    getRecentTransactions().then(setTransactions);
  }, []);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newTxn.amount || newTxn.amount <= 0) {
        alert("تنبيه: لا يمكن تسجيل حركة مالية بمبلغ 0. يرجى إدخال المبلغ الصحيح.");
        return;
    }

    let finalRecipientName = newTxn.toAccount;
    if (newTxn.recipientId) {
        const emp = MOCK_EMPLOYEES.find(e => e.id === newTxn.recipientId);
        if (emp) finalRecipientName = emp.name;
    }

    let finalDescription = newTxn.description || '';
    let finalToAccount = finalRecipientName;

    // Logic: If Creating New AND it's from Workshop -> Pending
    let status: 'Completed' | 'Pending_Settlement' = newTxn.status || 'Completed';
    if (!isEditMode && newTxn.fromAccount === 'صندوق الورشة' && newTxn.type === TransactionType.PAYMENT) {
        status = 'Pending_Settlement';
    }

    if (isEditMode && newTxn.id) {
        // Update
        const updatedTxns = transactions.map(t => {
            if (t.id === newTxn.id) {
                return {
                    ...t,
                    ...newTxn,
                    toAccount: finalToAccount || t.toAccount,
                    recipientName: finalRecipientName || t.recipientName,
                    status: status
                } as Transaction;
            }
            return t;
        });
        setTransactions(updatedTxns);
    } else {
        // Create
        const txn: Transaction = {
            id: `txn-${Date.now()}`,
            type: newTxn.type as TransactionType,
            date: newTxn.date || new Date().toISOString().split('T')[0],
            amount: newTxn.amount || 0,
            currency: 'USD', 
            description: finalDescription,
            fromAccount: newTxn.fromAccount || 'الخزينة الرئيسية',
            toAccount: finalToAccount || 'مصروفات',
            projectId: newTxn.projectId || 'General', 
            attachmentUrl: newTxn.attachmentUrl,
            recipientType: newTxn.recipientType as any,
            recipientId: newTxn.recipientId,
            recipientName: finalRecipientName,
            status: status,
            actualPaymentDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
        };
        setTransactions([txn, ...transactions]);
    }

    setIsModalOpen(false);
    resetForm();
    
    if (!isEditMode && status === 'Pending_Settlement') {
        alert('تم تسجيل المصروف على الورشة.\nالحالة: معلق بانتظار الترحيل من الخزينة الرئيسية.');
    }
  };

  const resetForm = () => {
    setNewTxn({ 
        id: undefined,
        amount: 0, 
        currency: 'USD',
        description: '', 
        fromAccount: 'الخزينة الرئيسية', 
        toAccount: '', 
        type: TransactionType.PAYMENT,
        recipientType: 'Other',
        attachmentUrl: '',
        projectId: ''
    });
    setRecipientCategory('');
    setIsEditMode(false);
  }

  const handleOpenAddModal = () => {
    resetForm();
    let defaultType = TransactionType.PAYMENT;
    if (activeTab === 'revenues') defaultType = TransactionType.RECEIPT;
    if (activeTab === 'transfers') defaultType = TransactionType.TRANSFER;

    setNewTxn(prev => ({ ...prev, type: defaultType }));
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (txn: Transaction) => {
      setNewTxn(txn);
      setIsEditMode(true);
      if (txn.recipientId) {
          const emp = MOCK_EMPLOYEES.find(e => e.id === txn.recipientId);
          if (emp) {
               if (emp.type === EmployeeType.STAFF) setRecipientCategory('Staff');
               else if (emp.type === EmployeeType.CRAFTSMAN) setRecipientCategory('Craftsman');
               else if (emp.type === EmployeeType.WORKER) setRecipientCategory('Worker');
          }
      }
      setIsModalOpen(true);
  };

  const initiateSettlement = (txn: Transaction) => {
      setTxnToSettle(txn);
      setSettleDate(new Date().toISOString().split('T')[0]);
      setIsSettleModalOpen(true);
  };

  const confirmSettlement = (e: React.FormEvent) => {
      e.preventDefault();
      if (!txnToSettle) return;

      const updatedTxns = transactions.map(t => {
          if (t.id === txnToSettle.id) {
              return {
                  ...t,
                  status: 'Completed' as const,
                  actualPaymentDate: settleDate,
              };
          }
          return t;
      });

      setTransactions(updatedTxns);
      setIsSettleModalOpen(false);
      setTxnToSettle(null);
      alert('تم ترحيل الدفعة وتسويتها بنجاح.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        // Create a local URL for preview/access
        setNewTxn({...newTxn, attachmentUrl: URL.createObjectURL(e.target.files[0])});
    }
  };

  // --- Filter Logic ---
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description.includes(searchTerm) || txn.fromAccount.includes(searchTerm) || txn.toAccount.includes(searchTerm);
    const isUSD = txn.currency === 'USD';
    let matchesType = false;

    if (activeTab === 'expenses') {
        matchesType = txn.type === TransactionType.PAYMENT;
        if (matchesType) {
             if (expenseSubTab === 'completed') {
                 matchesType = (!txn.status || txn.status === 'Completed');
             } else {
                 matchesType = (txn.status === 'Pending_Settlement');
             }
        }
    }
    else if (activeTab === 'revenues') matchesType = txn.type === TransactionType.RECEIPT;
    else if (activeTab === 'transfers') matchesType = txn.type === TransactionType.TRANSFER;

    return matchesType && matchesSearch && isUSD;
  });

  const currentTotal = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const getEmployeesByCategory = () => {
      if (!recipientCategory) return [];
      let type: EmployeeType;
      switch(recipientCategory) {
          case 'Staff': type = EmployeeType.STAFF; break;
          case 'Craftsman': type = EmployeeType.CRAFTSMAN; break;
          case 'Worker': type = EmployeeType.WORKER; break;
          default: return [];
      }
      return MOCK_EMPLOYEES.filter(e => e.type === type);
  };

  const getProjectName = (id: string | undefined) => {
      if (!id || id === 'General' || id === 'N/A') return null;
      return MOCK_PROJECTS.find(p => p.id === id)?.name;
  }

  // --- UI Helpers ---
  const getTabColorClass = () => {
      switch(activeTab) {
          case 'expenses': return 'blue';
          case 'revenues': return 'green';
          case 'transfers': return 'orange';
      }
  };

  // Data for Selects
  const projectOptions = [
      { value: '', label: 'عام (بدون مشروع محدد)' },
      ...MOCK_PROJECTS.map(p => ({ value: p.id, label: `${p.name} - ${p.clientName}` }))
  ];

  const employeeOptions = getEmployeesByCategory().map(emp => ({ 
      value: emp.id, 
      label: `${emp.name} - ${emp.role}` 
  }));

  const accountOptions = [
      { value: 'الخزينة الرئيسية', label: 'الخزينة الرئيسية' },
      { value: 'صندوق الورشة', label: 'صندوق الورشة' },
      { value: 'البنك - الأهلي', label: 'البنك - الأهلي' },
      { value: 'البنك - الراجحي', label: 'البنك - الراجحي' },
      { value: 'عهدة موظف', label: 'عهدة موظف' },
      { value: 'أخرى', label: 'أخرى' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحركات المالية $</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">سجل المدفوعات، المقبوضات، والتحويلات البنكية (بالدولار الأمريكي)</p>
        </div>
      </div>

      {/* Main Tabs - Color Coded */}
      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto">
         <button 
           onClick={() => setActiveTab('expenses')}
           className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <TrendingDown size={18} />
           المصاريف
         </button>
         <button 
           onClick={() => setActiveTab('revenues')}
           className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'revenues' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <TrendingUp size={18} />
           الإيرادات
         </button>
         <button 
           onClick={() => setActiveTab('transfers')}
           className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'transfers' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <RefreshCcw size={18} />
           التحويلات
         </button>
      </div>
      
      {/* Sub-Tabs for Expenses Only */}
      {activeTab === 'expenses' && (
          <div className="flex gap-2">
              <button 
                onClick={() => setExpenseSubTab('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${expenseSubTab === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900' : 'bg-white dark:bg-dark-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-700'}`}
              >
                  <CheckCircle size={16} />
                  مصاريف مرحلة (مدفوعة)
              </button>
              <button 
                onClick={() => setExpenseSubTab('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${expenseSubTab === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900' : 'bg-white dark:bg-dark-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-700'}`}
              >
                  <Clock size={16} />
                  مصاريف معلقة (بانتظار الترحيل)
                  {transactions.filter(t => t.type === TransactionType.PAYMENT && t.status === 'Pending_Settlement').length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full animate-pulse">
                          {transactions.filter(t => t.type === TransactionType.PAYMENT && t.status === 'Pending_Settlement').length}
                      </span>
                  )}
              </button>
          </div>
      )}

      {/* Summary Card - Dynamic Colors */}
      <div className={`p-6 rounded-2xl border flex items-center justify-between ${
          activeTab === 'expenses' ? 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/10 dark:border-blue-900 dark:text-blue-300' : 
          activeTab === 'revenues' ? 'bg-green-50 border-green-100 text-green-800 dark:bg-green-900/10 dark:border-green-900 dark:text-green-300' : 
          'bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-900/10 dark:border-orange-900 dark:text-orange-300'
      }`}>
          <div>
            <p className="text-sm font-bold opacity-80 mb-1">
                {activeTab === 'expenses' 
                    ? (expenseSubTab === 'pending' ? 'إجمالي المصاريف المعلقة' : 'إجمالي المصاريف المرحلة') 
                    : (activeTab === 'revenues' ? 'إجمالي الإيرادات المقبوضة' : 'إجمالي التحويلات الداخلية')}
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight">{formatCurrency(currentTotal, 'USD')}</h2>
          </div>
          <div className={`p-4 rounded-2xl shadow-sm ${
              activeTab === 'expenses' ? 'bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-400' : 
              activeTab === 'revenues' ? 'bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-400' : 
              'bg-orange-200 text-orange-700 dark:bg-orange-900 dark:text-orange-400'
          }`}>
            {activeTab === 'expenses' ? <ArrowUpRight size={32} /> : 
             activeTab === 'revenues' ? <ArrowDownLeft size={32} /> : 
             <RefreshCcw size={32} />}
          </div>
      </div>

      {/* Actions & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800">
        <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="بحث في الحركات..." 
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={handleOpenAddModal}
                className={`text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg font-bold ${
                    activeTab === 'expenses' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 
                    activeTab === 'revenues' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 
                    'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30'
                }`}
            >
                <PlusCircle size={18} />
                <span>
                    {activeTab === 'expenses' ? 'تسجيل مصروف' : 
                     activeTab === 'revenues' ? 'تسجيل إيراد' : 
                     'تحويل جديد'}
                </span>
            </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-700">
              <tr>
                <th className="px-6 py-4 font-medium">نوع الحركة</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">الوصف</th>
                <th className="px-6 py-4 font-medium">المشروع</th>
                <th className="px-6 py-4 font-medium">من حساب</th>
                <th className="px-6 py-4 font-medium">إلى حساب</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium">المرفقات</th>
                <th className="px-6 py-4 font-medium">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        txn.type === TransactionType.RECEIPT ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        txn.type === TransactionType.PAYMENT ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {txn.type === TransactionType.RECEIPT ? <ArrowDownLeft size={16} /> :
                         txn.type === TransactionType.PAYMENT ? <ArrowUpRight size={16} /> :
                         <RefreshCcw size={16} />}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{txn.type === TransactionType.RECEIPT ? 'سند قبض' : 'سند صرف'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      <div className="flex flex-col">
                          <span className="font-bold text-gray-700 dark:text-gray-300">{txn.date}</span>
                          {txn.actualPaymentDate && txn.actualPaymentDate !== txn.date && (
                              <span className="text-[9px] text-green-600 font-bold mt-1 bg-green-50 dark:bg-green-900/20 px-1 rounded w-fit" title="تاريخ الصرف الفعلي">
                                  فعلي: {txn.actualPaymentDate}
                              </span>
                          )}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-xs truncate font-medium">
                    {txn.description}
                  </td>
                  <td className="px-6 py-4">
                      {txn.projectId && txn.projectId !== 'General' && txn.projectId !== 'N/A' ? (
                          <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded text-xs font-bold text-gray-700 dark:text-gray-300">
                              <Briefcase size={12} />
                              {getProjectName(txn.projectId) || txn.projectId}
                          </span>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {txn.fromAccount}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {txn.toAccount}
                  </td>
                  <td className={`px-6 py-4 font-bold text-base ${
                    txn.type === TransactionType.RECEIPT ? 'text-green-600' : 
                    txn.type === TransactionType.PAYMENT ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {formatCurrency(txn.amount, 'USD')}
                  </td>
                  <td className="px-6 py-4">
                     {txn.attachmentUrl ? (
                         <button 
                            className="flex items-center gap-1 text-primary-600 hover:text-primary-800 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded text-xs font-bold transition-colors"
                            onClick={() => window.open(txn.attachmentUrl, '_blank')}
                         >
                             {txn.attachmentUrl.includes('pdf') ? <FileText size={14} /> : <Paperclip size={14} />}
                             عرض الفاتورة
                         </button>
                     ) : (
                         <span className="text-gray-300 text-xs">-</span>
                     )}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                     {txn.status === 'Pending_Settlement' ? (
                         <button 
                            onClick={() => initiateSettlement(txn)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            title="ترحيل واعتماد"
                         >
                             <Check size={14} />
                             ترحيل
                         </button>
                     ) : (
                        <button 
                            onClick={() => handleOpenEditModal(txn)}
                            className="text-gray-500 hover:text-primary-600 bg-gray-100 hover:bg-primary-50 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-gray-400 p-1.5 rounded-lg transition-colors"
                            title="تعديل"
                        >
                            <Edit size={14} />
                        </button>
                     )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                  <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-600">
                          {activeTab === 'expenses' && expenseSubTab === 'pending' 
                             ? 'لا توجد مصاريف معلقة بانتظار الترحيل' 
                             : 'لا توجد حركات مسجلة في هذا القسم'}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Add/Edit Transaction Modal */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "تعديل حركة مالية" : "تسجيل حركة مالية جديدة (USD)"}>
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          
          <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700">
             <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الحركة</label>
                    <select
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-200 dark:bg-dark-900 text-gray-500 cursor-not-allowed font-bold"
                    value={newTxn.type}
                    onChange={(e) => setNewTxn({...newTxn, type: e.target.value as TransactionType})}
                    >
                    <option value={TransactionType.PAYMENT}>سند صرف (دفع)</option>
                    <option value={TransactionType.RECEIPT}>سند قبض (استلام)</option>
                    <option value={TransactionType.TRANSFER}>تحويل داخلي</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ ($) <span className="text-red-500">*</span></label>
                    <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white font-bold text-lg"
                    value={newTxn.amount}
                    onChange={(e) => setNewTxn({...newTxn, amount: Number(e.target.value)})}
                    />
                </div>
             </div>
             
             {/* Project Selection with SearchableSelect */}
             <div>
                <SearchableSelect 
                    label="ربط بالمشروع (هام)"
                    options={projectOptions}
                    value={newTxn.projectId || ''}
                    onChange={(val) => setNewTxn({...newTxn, projectId: val})}
                    placeholder="ابحث عن المشروع..."
                />
                <p className="text-[10px] text-gray-400 mt-1">اختيار المشروع يضمن ظهور الحركة في كشف حساب المشروع والعميل.</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <SearchableSelect
                  label="من حساب"
                  options={accountOptions}
                  value={newTxn.fromAccount || 'الخزينة الرئيسية'}
                  onChange={(val) => setNewTxn({...newTxn, fromAccount: val})}
                  required
                />
                {newTxn.fromAccount === 'صندوق الورشة' && newTxn.type === TransactionType.PAYMENT && (
                    <p className="text-xs text-orange-600 mt-1 font-bold">
                        * سيتم تسجيل الحركة كـ "معلقة"
                    </p>
                )}
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى حساب / المستفيد</label>
                <input 
                  type="text" 
                  placeholder={newTxn.type === TransactionType.PAYMENT ? "المورد / الجهة" : "البنك / الصندوق"}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                  value={newTxn.toAccount}
                  onChange={(e) => setNewTxn({...newTxn, toAccount: e.target.value})}
                  disabled={!!newTxn.recipientId} // Disable if HR is selected
                />
             </div>
          </div>

          {/* HR Linking Section */}
          {newTxn.type === TransactionType.PAYMENT && (
              <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-dark-600 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <HardHat size={16} />
                        ربط بموظف / حرفي
                    </h4>
                    {newTxn.recipientId && (
                        <button type="button" onClick={() => {setRecipientCategory(''); setNewTxn({...newTxn, recipientId: ''})}} className="text-xs text-red-500 hover:underline">إلغاء الربط</button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <select 
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none dark:bg-dark-950 dark:text-white"
                            value={recipientCategory}
                            onChange={(e) => {
                                setRecipientCategory(e.target.value);
                                setNewTxn({...newTxn, recipientId: '', recipientType: e.target.value as any});
                            }}
                          >
                              <option value="">الفئة...</option>
                              <option value="Staff">كادر إداري</option>
                              <option value="Craftsman">حرفي</option>
                              <option value="Worker">عامل</option>
                          </select>
                      </div>
                      <div>
                          <SearchableSelect 
                             options={employeeOptions}
                             value={newTxn.recipientId || ''}
                             onChange={(val) => {
                                 const selectedEmp = MOCK_EMPLOYEES.find(emp => emp.id === val);
                                 setNewTxn({
                                     ...newTxn, 
                                     recipientId: val,
                                     toAccount: selectedEmp ? selectedEmp.name : newTxn.toAccount
                                 });
                             }}
                             disabled={!recipientCategory}
                             placeholder="اختر الاسم..."
                          />
                      </div>
                  </div>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف / البيان</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none dark:bg-dark-950 dark:text-white"
              value={newTxn.description}
              onChange={(e) => setNewTxn({...newTxn, description: e.target.value})}
            />
          </div>

          {/* Attachments (Enhanced UI) */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المرفقات (فاتورة)</label>
             <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer relative transition-colors bg-gray-50 dark:bg-dark-900">
                <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col items-center group">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <FileText size={16} />
                        </div>
                        <span className="text-[10px]">PDF</span>
                    </div>
                    <div className="w-px bg-gray-300 h-8"></div>
                    <div className="flex flex-col items-center group">
                         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Camera size={16} />
                        </div>
                        <span className="text-[10px]">صورة</span>
                    </div>
                </div>
                {newTxn.attachmentUrl && (
                    <div className="absolute inset-0 bg-green-50 dark:bg-green-900/90 flex items-center justify-center rounded-lg backdrop-blur-sm">
                        <span className="text-green-700 dark:text-green-400 font-bold text-sm flex items-center gap-2">
                            <Check size={16} /> تم إرفاق الملف
                        </span>
                    </div>
                )}
             </div>
          </div>
          
          <div className="pt-2 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg"
            >
              {isEditMode ? 'حفظ التعديلات' : 'حفظ الحركة'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle/Post Modal */}
      <Modal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} title="ترحيل واعتماد المصروف">
          <form onSubmit={confirmSettlement} className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-1">تفاصيل المصروف المعلق</p>
                  <p className="font-bold text-gray-800 dark:text-white">{txnToSettle?.description}</p>
                  <p className="text-xl font-bold text-blue-600 mt-2">{formatCurrency(txnToSettle?.amount || 0, 'USD')}</p>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ الدفع الفعلي (من الخزينة)</label>
                  <input 
                      type="date" 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                      value={settleDate}
                      onChange={(e) => setSettleDate(e.target.value)}
                  />
              </div>

              <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-green-500/20">
                      تأكيد الترحيل والدفع
                  </button>
                  <button type="button" onClick={() => setIsSettleModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">
                      إلغاء
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Transactions;
