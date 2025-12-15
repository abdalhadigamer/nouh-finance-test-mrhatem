
import React, { useEffect, useState } from 'react';
import { getRecentTransactions, formatCurrency } from '../services/dataService';
import { Transaction, TransactionType, EmployeeType, Invoice, InvoiceType, StatementRow, InvestorTransaction, TrustTransaction, User } from '../types';
import { MOCK_EMPLOYEES, MOCK_PROJECTS, MOCK_INVOICES, MOCK_INVESTORS, MOCK_TRUSTEES, MOCK_INVESTOR_TRANSACTIONS, MOCK_TRUST_TRANSACTIONS, MOCK_TRANSACTIONS } from '../constants';
import { logActivity } from '../services/auditService';
import { 
  PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCcw, 
  Check, Camera, Search, TrendingDown, TrendingUp, 
  HardHat, CheckCircle, Clock, Edit, FileText, Briefcase, X, Plus, User as UserIcon, Shield, Undo2, Link
} from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface TransactionsProps {
    selectedYear?: number;
    currentUser?: User; // Passed from App to know who is adding
}

type ReceiptSourceType = 'client' | 'investor' | 'trustee' | 'refund' | 'other';

const Transactions: React.FC<TransactionsProps> = ({ selectedYear, currentUser }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'revenues' | 'transfers'>('expenses');
  const [expenseSubTab, setExpenseSubTab] = useState<'completed' | 'pending'>('completed');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [receiptSourceType, setReceiptSourceType] = useState<ReceiptSourceType>('client');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(''); 
  
  // Quick Add Item State
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Settlement State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [txnToSettle, setTxnToSettle] = useState<Transaction | null>(null);
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [newTxn, setNewTxn] = useState<Partial<Transaction>>({
    amount: 0,
    currency: 'USD',
    description: '',
    fromAccount: 'الخزينة الرئيسية',
    toAccount: '',
    type: TransactionType.PAYMENT,
    recipientType: 'Other',
    projectId: 'General',
    statementItemId: '',
    hasLinkedInvoice: false 
  });

  useEffect(() => {
    // Ensure we load the latest from the global mock
    setTransactions([...MOCK_TRANSACTIONS]);
  }, [isModalOpen, isSettleModalOpen]); // Refresh when modals close

  // --- Validation Logic ---
  const validateTransaction = () => {
      const errors: string[] = [];
      if (!newTxn.amount || newTxn.amount <= 0) errors.push("قيمة المبلغ يجب أن تكون أكبر من 0.");
      if (!newTxn.description?.trim()) errors.push("يرجى كتابة وصف للحركة.");
      if (!newTxn.fromAccount && newTxn.type !== TransactionType.RECEIPT) errors.push("يرجى تحديد الحساب المصدر.");
      if (isAddingNewItem && !newItemName.trim()) errors.push("يرجى كتابة اسم البند الجديد.");
      if (selectedSpecialty && !newTxn.recipientId && newTxn.type === TransactionType.PAYMENT) errors.push("يرجى اختيار الحرفي.");
      return errors;
  };

  // --- Sync Logic (The Brain) ---
  const syncWithSubLedgers = (txn: Transaction) => {
      // 1. Investor Sync
      if (receiptSourceType === 'investor' && txn.recipientId) {
          const subTxn: InvestorTransaction = {
              id: `it-sync-${txn.id}`,
              investorId: txn.recipientId,
              type: 'Capital_Injection',
              amount: txn.amount,
              date: txn.date,
              notes: `إيداع نقدي (قيد رقم: ${txn.serialNumber}) - ${txn.description}`
          };
          MOCK_INVESTOR_TRANSACTIONS.unshift(subTxn);
      }
      
      // 2. Trustee Sync
      if (receiptSourceType === 'trustee' && txn.recipientId) {
          const subTxn: TrustTransaction = {
              id: `tt-sync-${txn.id}`,
              trusteeId: txn.recipientId,
              type: 'Deposit',
              amount: txn.amount,
              date: txn.date,
              notes: `إيداع أمانة (قيد رقم: ${txn.serialNumber}) - ${txn.description}`
          };
          MOCK_TRUST_TRANSACTIONS.unshift(subTxn);
      }

      // 3. Project Statement Sync (If new item added)
      if (isAddingNewItem && newItemName.trim() && txn.projectId) {
          const project = MOCK_PROJECTS.find(p => p.id === txn.projectId);
          if (project) {
              if (!project.statementRows) project.statementRows = [];
              project.statementRows.push({
                  id: txn.statementItemId || `stm-${Date.now()}`,
                  item: newItemName,
                  notes: 'تمت الإضافة من الحركات المالية'
              });
          }
      }

      // 4. Auto-Invoice Creation
      if (txn.hasLinkedInvoice && txn.type === TransactionType.PAYMENT) {
          const placeholderInvoice: Invoice = {
              id: `inv-auto-${txn.id}`,
              invoiceNumber: `مسودة - قيد ${txn.serialNumber}`,
              systemSerial: `REF-${txn.serialNumber}`,
              date: txn.date,
              projectId: txn.projectId || 'General',
              supplierName: txn.toAccount || 'مورد عام',
              amount: txn.amount,
              subtotal: txn.amount,
              totalAmount: txn.amount,
              discount: 0,
              items: [],
              status: txn.status === 'Completed' ? 'Paid' : 'Pending',
              type: InvoiceType.PURCHASE,
              category: selectedSpecialty ? `مشتريات ${getSpecialtyLabel(selectedSpecialty)}` : 'مشتريات تلقائية',
              isClientVisible: false, 
              notes: `تم توليد هذه الفاتورة تلقائياً لتطابق القيد المالي رقم ${txn.serialNumber}.`
          };
          MOCK_INVOICES.unshift(placeholderInvoice);
      }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateTransaction();
    if (errors.length > 0) {
        alert("تنبيه:\n" + errors.map(e => "• " + e).join("\n"));
        return;
    }

    // --- Prepare Data ---
    let finalRecipientName = newTxn.toAccount;
    let finalFromAccount = newTxn.fromAccount;
    let finalRecipientType = newTxn.recipientType;
    
    // Logic for Receipt Source Names
    if (newTxn.type === TransactionType.RECEIPT) {
        if (receiptSourceType === 'client' && newTxn.projectId) {
            const proj = MOCK_PROJECTS.find(p => p.id === newTxn.projectId);
            finalFromAccount = proj ? proj.clientName : 'عميل';
            finalRecipientType = 'Client';
        } else if (receiptSourceType === 'investor' && newTxn.recipientId) {
            const inv = MOCK_INVESTORS.find(i => i.id === newTxn.recipientId);
            finalFromAccount = inv ? inv.name : 'مستثمر';
            finalRecipientType = 'Investor';
        } else if (receiptSourceType === 'trustee' && newTxn.recipientId) {
            const tr = MOCK_TRUSTEES.find(t => t.id === newTxn.recipientId);
            finalFromAccount = tr ? tr.name : 'صاحب أمانة';
            finalRecipientType = 'Trustee';
        }
    } else if (newTxn.type === TransactionType.PAYMENT && newTxn.recipientId) {
        const emp = MOCK_EMPLOYEES.find(e => e.id === newTxn.recipientId);
        if (emp) finalRecipientName = emp.name;
    }

    let finalDescription = newTxn.description || '';
    let finalStatementItemId = newTxn.statementItemId;
    if (isAddingNewItem) {
        finalStatementItemId = `stm-row-${Date.now()}`;
        finalDescription = `${finalDescription} - (بند: ${newItemName})`;
    }

    // --- Serial Number Generation (Distinct Ranges) ---
    // Receipts: 1000+, Payments: 5000+, Transfers: 9000+
    let finalSerial = newTxn.serialNumber;
    if (!isEditMode && !finalSerial) {
        let baseSerial = 0;
        
        if (newTxn.type === TransactionType.RECEIPT) baseSerial = 1000;
        else if (newTxn.type === TransactionType.PAYMENT) baseSerial = 5000;
        else if (newTxn.type === TransactionType.TRANSFER) baseSerial = 9000;

        const existingSerials = MOCK_TRANSACTIONS
            .filter(t => t.type === newTxn.type)
            .map(t => t.serialNumber || 0);
            
        const maxCurrent = existingSerials.length > 0 ? Math.max(...existingSerials) : baseSerial;
        finalSerial = maxCurrent + 1;
    }

    // Status Determination
    let status: 'Completed' | 'Pending_Settlement' = newTxn.status || 'Completed';
    if (!isEditMode && newTxn.fromAccount === 'صندوق الورشة' && newTxn.type === TransactionType.PAYMENT) {
        status = 'Pending_Settlement';
    }

    const transactionData: Transaction = {
        ...newTxn as Transaction,
        id: isEditMode && newTxn.id ? newTxn.id : `txn-${Date.now()}`,
        serialNumber: finalSerial,
        date: newTxn.date || new Date().toISOString().split('T')[0],
        description: finalDescription,
        fromAccount: finalFromAccount || 'الخزينة الرئيسية',
        toAccount: newTxn.type === TransactionType.PAYMENT ? (finalRecipientName || 'مصروفات') : (newTxn.toAccount || 'الخزينة الرئيسية'),
        recipientName: finalRecipientName,
        recipientType: finalRecipientType,
        statementItemId: finalStatementItemId,
        status: status,
        actualPaymentDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
        referenceId: newTxn.hasLinkedInvoice ? `REF-${finalSerial}` : undefined
    };

    // --- Save & Sync & Audit Log ---
    if (isEditMode) {
        const index = MOCK_TRANSACTIONS.findIndex(t => t.id === transactionData.id);
        if (index !== -1) {
            MOCK_TRANSACTIONS[index] = transactionData;
            // Audit
            if (currentUser) {
                logActivity(currentUser, 'UPDATE', 'Transaction', `تعديل القيد رقم ${finalSerial}: ${finalDescription}`, transactionData.id);
            }
        }
    } else {
        MOCK_TRANSACTIONS.unshift(transactionData);
        syncWithSubLedgers(transactionData);
        // Audit
        if (currentUser) {
            logActivity(currentUser, 'CREATE', 'Transaction', `إضافة ${transactionData.type} رقم ${finalSerial} بقيمة ${transactionData.amount}`, transactionData.id);
        }
    }

    setTransactions([...MOCK_TRANSACTIONS]); // Trigger Re-render
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTxn({ 
        serialNumber: undefined, amount: 0, currency: 'USD', description: '', 
        fromAccount: 'الخزينة الرئيسية', toAccount: '', type: TransactionType.PAYMENT,
        recipientType: 'Other', projectId: 'General', statementItemId: '', hasLinkedInvoice: false
    });
    setSelectedSpecialty('');
    setReceiptSourceType('client');
    setIsEditMode(false);
    setIsAddingNewItem(false);
    setNewItemName('');
  }

  const handleOpenAddModal = () => {
    resetForm();
    let defaultType = TransactionType.PAYMENT;
    if (activeTab === 'revenues') defaultType = TransactionType.RECEIPT;
    if (activeTab === 'transfers') defaultType = TransactionType.TRANSFER;

    setNewTxn(prev => ({ 
        ...prev, 
        type: defaultType,
        toAccount: defaultType === TransactionType.RECEIPT ? 'الخزينة الرئيسية' : ''
    }));
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

      const index = MOCK_TRANSACTIONS.findIndex(t => t.id === txnToSettle.id);
      if (index !== -1) {
          MOCK_TRANSACTIONS[index] = {
              ...MOCK_TRANSACTIONS[index],
              status: 'Completed',
              actualPaymentDate: settleDate
          };
          if (currentUser) {
              logActivity(currentUser, 'APPROVE', 'Transaction', `ترحيل القيد رقم ${txnToSettle.serialNumber}`, txnToSettle.id);
          }
      }
      setTransactions([...MOCK_TRANSACTIONS]);
      setIsSettleModalOpen(false);
      setTxnToSettle(null);
  };

  // --- Filtering ---
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description.includes(searchTerm) || txn.fromAccount.includes(searchTerm) || txn.toAccount.includes(searchTerm);
    const matchesYear = selectedYear ? txn.date.startsWith(selectedYear.toString()) : true;
    let matchesType = false;

    if (activeTab === 'expenses') {
        matchesType = txn.type === TransactionType.PAYMENT;
        if (matchesType) {
             matchesType = expenseSubTab === 'completed' ? (!txn.status || txn.status === 'Completed') : (txn.status === 'Pending_Settlement');
        }
    }
    else if (activeTab === 'revenues') matchesType = txn.type === TransactionType.RECEIPT;
    else if (activeTab === 'transfers') matchesType = txn.type === TransactionType.TRANSFER;

    return matchesType && matchesSearch && matchesYear;
  });

  const currentTotal = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  // Helper UI Data
  const getSpecialtyLabel = (key: string) => {
      const labels: any = { 'plumbing': 'أعمال صحية', 'electrical': 'أعمال كهرباء', 'carpentry': 'نجارة', 'painting': 'دهانات', 'general_worker': 'عمالة' };
      return labels[key] || key;
  };

  const getEmployeesBySpecialty = () => {
      if (!selectedSpecialty) return [];
      return MOCK_EMPLOYEES.filter(emp => {
          if (selectedSpecialty === 'general_worker') return emp.type === EmployeeType.WORKER;
          const role = emp.role.toLowerCase();
          if (selectedSpecialty === 'plumbing') return role.includes('سباك');
          if (selectedSpecialty === 'electrical') return role.includes('كهرباء');
          if (selectedSpecialty === 'carpentry') return role.includes('نجار');
          if (selectedSpecialty === 'painting') return role.includes('دهان');
          return false;
      });
  };

  const getStatementItemsForProject = () => {
      if (!newTxn.projectId || newTxn.projectId === 'General') return [];
      const project = MOCK_PROJECTS.find(p => p.id === newTxn.projectId);
      return project?.statementRows?.map(row => ({ value: row.id, label: row['item'] || 'بند' })) || [];
  };

  const getAccountOptions = () => {
      const base = [{ value: 'الخزينة الرئيسية', label: 'الخزينة الرئيسية' }];
      if (newTxn.projectId && newTxn.projectId !== 'General') base.push({ value: 'صندوق الورشة', label: 'صندوق الورشة (المشروع)' });
      if (!newTxn.projectId || newTxn.projectId === 'General') base.push({ value: 'عهدة موظف', label: 'عهدة موظف' });
      return base;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحركات المالية $</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">سجل المدفوعات والمقبوضات (الخزينة والمشاريع)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto">
         <button onClick={() => setActiveTab('expenses')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}><TrendingDown size={18} /> المصاريف</button>
         <button onClick={() => setActiveTab('revenues')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'revenues' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}><TrendingUp size={18} /> الإيرادات</button>
         <button onClick={() => setActiveTab('transfers')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'transfers' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}><RefreshCcw size={18} /> التحويلات</button>
      </div>
      
      {/* Sub-Tabs (Expenses) */}
      {activeTab === 'expenses' && (
          <div className="flex gap-2">
              <button onClick={() => setExpenseSubTab('completed')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${expenseSubTab === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900' : 'bg-white dark:bg-dark-900 text-gray-600 border border-gray-200 dark:border-dark-700'}`}><CheckCircle size={16} /> مدفوعة</button>
              <button onClick={() => setExpenseSubTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${expenseSubTab === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900' : 'bg-white dark:bg-dark-900 text-gray-600 border border-gray-200 dark:border-dark-700'}`}><Clock size={16} /> معلقة (تحت التسوية)</button>
          </div>
      )}

      {/* Summary */}
      <div className={`p-6 rounded-2xl border flex items-center justify-between ${activeTab === 'expenses' ? 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/10 dark:border-blue-900 dark:text-blue-300' : activeTab === 'revenues' ? 'bg-green-50 border-green-100 text-green-800 dark:bg-green-900/10 dark:border-green-900 dark:text-green-300' : 'bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-900/10 dark:border-orange-900 dark:text-orange-300'}`}>
          <div>
            <p className="text-sm font-bold opacity-80 mb-1">الإجمالي للفترة الحالية</p>
            <h2 className="text-4xl font-extrabold tracking-tight">{formatCurrency(currentTotal, 'USD')}</h2>
          </div>
          <div className={`p-4 rounded-2xl shadow-sm bg-white/50`}>
            {activeTab === 'expenses' ? <ArrowUpRight size={32} /> : activeTab === 'revenues' ? <ArrowDownLeft size={32} /> : <RefreshCcw size={32} />}
          </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800">
        <div className="relative w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="بحث..." className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={handleOpenAddModal} className={`text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow-lg font-bold transition-colors ${activeTab === 'expenses' ? 'bg-blue-600 hover:bg-blue-700' : activeTab === 'revenues' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
            <PlusCircle size={18} />
            <span>{activeTab === 'expenses' ? 'تسجيل مصروف' : activeTab === 'revenues' ? 'تسجيل إيراد' : 'تحويل جديد'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-700">
              <tr>
                <th className="px-6 py-4">رقم القيد</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">الوصف</th>
                <th className="px-6 py-4">الجهة / المشروع</th>
                <th className="px-6 py-4">من حساب</th>
                <th className="px-6 py-4">إلى حساب</th>
                <th className="px-6 py-4">المبلغ</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-700 dark:text-gray-300">#{txn.serialNumber}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{txn.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-white truncate max-w-xs">{txn.description}</td>
                  <td className="px-6 py-4">
                      {txn.projectId && txn.projectId !== 'General' ? 
                        <span className="bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 w-fit"><Briefcase size={10} /> {MOCK_PROJECTS.find(p => p.id === txn.projectId)?.name}</span> : 
                        <span className="text-gray-400 text-xs">عام</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.fromAccount}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.toAccount}</td>
                  <td className={`px-6 py-4 font-bold ${txn.type === TransactionType.RECEIPT ? 'text-green-600' : 'text-blue-600'}`}>{formatCurrency(txn.amount)}</td>
                  <td className="px-6 py-4">
                     {txn.status === 'Pending_Settlement' && (
                         <button onClick={() => initiateSettlement(txn)} className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-primary-700"><Check size={14} /> ترحيل</button>
                     )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">لا توجد حركات</td></tr>}
            </tbody>
        </table>
      </div>

      {/* Main Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل حركة مالية جديدة">
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700">
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">نوع الحركة</label>
                    <select disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 font-bold" value={newTxn.type}>
                        <option value={TransactionType.PAYMENT}>سند صرف</option>
                        <option value={TransactionType.RECEIPT}>سند قبض</option>
                        <option value={TransactionType.TRANSFER}>تحويل</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">المبلغ ($)</label>
                    <input required type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none" value={newTxn.amount} onChange={(e) => setNewTxn({...newTxn, amount: Number(e.target.value)})} />
                </div>
             </div>
          </div>

          {/* Receipt Source Logic */}
          {newTxn.type === TransactionType.RECEIPT && (
             <div className="space-y-3">
                 <div className="flex gap-2 overflow-x-auto pb-2">
                     {[{id: 'client', label: 'عميل', icon: UserIcon}, {id: 'investor', label: 'مستثمر', icon: TrendingUp}, {id: 'trustee', label: 'أمانة', icon: Shield}, {id: 'other', label: 'عام', icon: Plus}].map((type: any) => (
                         <button type="button" key={type.id} onClick={() => setReceiptSourceType(type.id)} className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${receiptSourceType === type.id ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                             <type.icon size={16} /> {type.label}
                         </button>
                     ))}
                 </div>
                 {receiptSourceType === 'client' && <SearchableSelect label="المشروع" options={MOCK_PROJECTS.map(p => ({ value: p.id, label: p.name }))} value={newTxn.projectId || ''} onChange={(val) => setNewTxn({...newTxn, projectId: val})} />}
                 {receiptSourceType === 'investor' && <SearchableSelect label="المستثمر" options={MOCK_INVESTORS.map(i => ({ value: i.id, label: i.name }))} value={newTxn.recipientId || ''} onChange={(val) => setNewTxn({...newTxn, recipientId: val})} />}
                 {receiptSourceType === 'trustee' && <SearchableSelect label="صاحب الأمانة" options={MOCK_TRUSTEES.map(t => ({ value: t.id, label: t.name }))} value={newTxn.recipientId || ''} onChange={(val) => setNewTxn({...newTxn, recipientId: val})} />}
                 {receiptSourceType === 'other' && <input type="text" placeholder="اسم الجهة" className="w-full px-4 py-2 border rounded-lg" value={newTxn.fromAccount} onChange={(e) => setNewTxn({...newTxn, fromAccount: e.target.value})} />}
             </div>
          )}

          {/* Payment Logic */}
          {newTxn.type === TransactionType.PAYMENT && (
             <div className="space-y-3">
                <SearchableSelect label="توجيه المصروف" options={[{value: 'General', label: 'مصاريف عامة'}, ...MOCK_PROJECTS.map(p => ({ value: p.id, label: p.name }))]} value={newTxn.projectId || 'General'} onChange={(val) => setNewTxn({...newTxn, projectId: val})} />
                
                {/* Statement Link */}
                {newTxn.projectId && newTxn.projectId !== 'General' && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        {isAddingNewItem ? (
                            <div className="flex gap-2 items-end">
                                <div className="flex-1"><label className="block text-xs font-bold mb-1 text-blue-800">اسم البند الجديد</label><input type="text" className="w-full border rounded p-2 text-sm" value={newItemName} onChange={e => setNewItemName(e.target.value)} autoFocus /></div>
                                <button type="button" onClick={() => setIsAddingNewItem(false)} className="p-2 bg-gray-200 rounded text-gray-600"><X size={16}/></button>
                            </div>
                        ) : (
                            <div className="flex items-end gap-2">
                                <div className="flex-1"><SearchableSelect label="بند العمل (الكشف المؤقت)" options={getStatementItemsForProject()} value={newTxn.statementItemId || ''} onChange={val => setNewTxn({...newTxn, statementItemId: val})} /></div>
                                <button type="button" onClick={() => setIsAddingNewItem(true)} className="bg-blue-600 text-white p-2 rounded-lg flex items-center gap-1 text-xs font-bold h-[42px]"><Plus size={14}/> جديد</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Recipient Logic */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">التخصص</label>
                        <select className="w-full px-3 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" value={selectedSpecialty} onChange={(e) => { setSelectedSpecialty(e.target.value); setNewTxn({...newTxn, recipientId: '', recipientType: e.target.value === 'general_worker' ? 'Worker' : 'Craftsman'}); }}>
                            <option value="">عام / مورد</option>
                            <option value="plumbing">سباكة</option>
                            <option value="electrical">كهرباء</option>
                            <option value="carpentry">نجارة</option>
                            <option value="painting">دهان</option>
                            <option value="general_worker">عمالة</option>
                        </select>
                    </div>
                    {selectedSpecialty && (
                        <div>
                            <SearchableSelect label="اسم المستلم" options={getEmployeesBySpecialty().map(e => ({ value: e.id, label: e.name }))} value={newTxn.recipientId || ''} onChange={(val) => setNewTxn({...newTxn, recipientId: val, toAccount: MOCK_EMPLOYEES.find(e => e.id === val)?.name})} />
                        </div>
                    )}
                </div>
                {!selectedSpecialty && <input type="text" placeholder="اسم المستفيد / المورد" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" value={newTxn.toAccount} onChange={(e) => setNewTxn({...newTxn, toAccount: e.target.value})} />}
             </div>
          )}

          {/* Accounts */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                 <SearchableSelect label="من حساب" options={getAccountOptions()} value={newTxn.fromAccount || 'الخزينة الرئيسية'} onChange={(val) => setNewTxn({...newTxn, fromAccount: val})} disabled={newTxn.type === TransactionType.RECEIPT} />
                 {newTxn.fromAccount === 'صندوق الورشة' && <p className="text-[10px] text-orange-600 mt-1">* سيتم تعليق الحركة حتى الترحيل</p>}
             </div>
             {newTxn.type === TransactionType.RECEIPT && (
                 <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">إلى حساب</label><input disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500" value="الخزينة الرئيسية" /></div>
             )}
          </div>

          <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">البيان</label><textarea rows={2} className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white resize-none" value={newTxn.description} onChange={(e) => setNewTxn({...newTxn, description: e.target.value})} /></div>

          {newTxn.type === TransactionType.PAYMENT && (
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                  <input type="checkbox" className="w-4 h-4" checked={newTxn.hasLinkedInvoice} onChange={(e) => setNewTxn({...newTxn, hasLinkedInvoice: e.target.checked})} />
                  <span className="text-sm font-bold text-purple-800 dark:text-purple-300">إنشاء فاتورة مرتبطة تلقائياً</span>
              </div>
          )}

          <div className="pt-2 flex gap-3">
            <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700">حفظ</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Settle Modal */}
      <Modal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} title="ترحيل مصروف">
          <form onSubmit={confirmSettlement} className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><p className="font-bold text-gray-800">{txnToSettle?.description}</p><p className="text-blue-600 font-bold text-lg mt-1">{formatCurrency(txnToSettle?.amount || 0)}</p></div>
              <div><label className="block text-sm font-bold mb-1">تاريخ الدفع الفعلي</label><input type="date" className="w-full px-4 py-2 border rounded-lg" value={settleDate} onChange={(e) => setSettleDate(e.target.value)} /></div>
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg">تأكيد الترحيل</button>
          </form>
      </Modal>
    </div>
  );
};

export default Transactions;
