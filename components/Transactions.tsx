
import React, { useState } from 'react';
import { formatCurrency } from '../services/dataService';
import { Transaction, TransactionType, Invoice, InvoiceType, User, Project, Employee, Client, ProjectStatus, EmployeeType, ActivityLog, Investor, Trustee, InvestorTransaction, TrustTransaction } from '../types';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCcw, Check, Search, TrendingDown, TrendingUp, CheckCircle, Clock, Briefcase, X, Plus, User as UserIcon, Shield, Wallet, HardHat, CheckSquare, FileText, Building2, Coins, CalendarDays, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface TransactionsProps {
    transactions: Transaction[];
    onUpdateTransactions: (transactions: Transaction[]) => void;
    projects: Project[];
    employees: Employee[];
    clients: Client[];
    investors?: Investor[];
    trustees?: Trustee[];
    selectedYear?: number;
    currentUser?: User;
    // Props for Auto-Invoice Feature
    invoices?: Invoice[];
    onUpdateInvoices?: (invoices: Invoice[]) => void;
    
    // Props for Ledger Sync
    investorTransactions?: InvestorTransaction[];
    onUpdateInvestorTransactions?: (txns: InvestorTransaction[]) => void;
    trustTransactions?: TrustTransaction[];
    onUpdateTrustTransactions?: (txns: TrustTransaction[]) => void;

    onAction?: (action: ActivityLog['action'], entity: ActivityLog['entity'], description: string, entityId?: string) => void;
}

type ReceiptSourceType = 'client' | 'investor' | 'trustee' | 'refund' | 'other';
type PaymentRecipientMode = 'external' | 'registered';
// New Types for Payment Context
type ExpenseContext = 'project' | 'company' | 'investor' | 'trust';
type PaymentSource = 'main_treasury' | 'project_pending'; 

const Transactions: React.FC<TransactionsProps> = ({ 
    transactions, 
    onUpdateTransactions, 
    projects, 
    employees, 
    clients, 
    investors = [],
    trustees = [],
    selectedYear, 
    currentUser,
    invoices = [],
    onUpdateInvoices,
    investorTransactions = [],
    onUpdateInvestorTransactions,
    trustTransactions = [],
    onUpdateTrustTransactions,
    onAction
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'revenues' | 'transfers' | 'pending'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  
  // Settle Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [txnToSettle, setTxnToSettle] = useState<Transaction | null>(null);
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Specific Form Logic States
  const [receiptSourceType, setReceiptSourceType] = useState<ReceiptSourceType>('client');
  const [recipientMode, setRecipientMode] = useState<PaymentRecipientMode>('external');
  
  // NEW: Expense Context State
  const [expenseContext, setExpenseContext] = useState<ExpenseContext>('project');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('main_treasury');
  const [selectedStatementItem, setSelectedStatementItem] = useState('');
  
  const [createLinkedInvoice, setCreateLinkedInvoice] = useState(false);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

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
    hasLinkedInvoice: false,
    status: 'Completed'
  });

  // Filter projects to exclude PROPOSED ones
  const activeProjects = projects.filter(p => p.status !== ProjectStatus.PROPOSED);
  
  // Filter Employees for Dropdown (Craftsmen & Workers)
  const craftsmenAndWorkers = employees.filter(e => e.type === EmployeeType.CRAFTSMAN || e.type === EmployeeType.WORKER);

  // --- Validation Logic ---
  const validateTransaction = () => {
      const errors: string[] = [];
      if (!newTxn.amount || newTxn.amount <= 0) errors.push("قيمة المبلغ يجب أن تكون أكبر من 0.");
      if (!newTxn.description?.trim()) errors.push("يرجى كتابة وصف للحركة.");
      
      if (newTxn.type === TransactionType.PAYMENT) {
          if (expenseContext === 'project' && !newTxn.projectId) errors.push("يرجى اختيار المشروع.");
          if (expenseContext === 'investor' && !newTxn.recipientId) errors.push("يرجى اختيار المستثمر.");
          if (expenseContext === 'trust' && !newTxn.recipientId) errors.push("يرجى اختيار صاحب الأمانة.");
      }
      
      if (newTxn.type === TransactionType.RECEIPT) {
          if (receiptSourceType === 'client' && !newTxn.projectId) errors.push("يرجى اختيار المشروع.");
          if (receiptSourceType === 'investor' && !newTxn.recipientId) errors.push("يرجى اختيار المستثمر.");
          if (receiptSourceType === 'trustee' && !newTxn.recipientId) errors.push("يرجى اختيار صاحب الأمانة.");
      }

      return errors;
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateTransaction();
    if (errors.length > 0) {
        alert("تنبيه:\n" + errors.map(e => "• " + e).join("\n"));
        return;
    }

    // --- Prepare Data Logic ---
    let finalRecipientName = newTxn.toAccount;
    let finalFromAccount = newTxn.fromAccount;
    let finalRecipientType = newTxn.recipientType;
    let finalRecipientId = newTxn.recipientId;
    let finalProjectId = newTxn.projectId;
    let finalStatus: 'Completed' | 'Pending_Settlement' = 'Completed';
    // By default, actual payment date is same as record date unless pending
    let finalActualDate = newTxn.date || new Date().toISOString().split('T')[0]; 

    let finalSerial = newTxn.serialNumber;
    if (!isEditMode && !finalSerial) {
        let baseSerial = newTxn.type === TransactionType.RECEIPT ? 1000 : 5000;
        const existingSerials = transactions.filter(t => t.type === newTxn.type).map(t => t.serialNumber || 0);
        finalSerial = (existingSerials.length > 0 ? Math.max(...existingSerials) : baseSerial) + 1;
    }

    // 1. Handle Receipts (Income)
    if (newTxn.type === TransactionType.RECEIPT) {
        finalRecipientName = 'الخزينة الرئيسية'; 
        
        if (receiptSourceType === 'client') {
            const project = projects.find(p => p.id === newTxn.projectId);
            finalFromAccount = project ? `${project.clientName} - ${project.name}` : 'عميل';
            finalRecipientType = 'Client';
        } else if (receiptSourceType === 'investor') {
            const investor = investors.find(i => i.id === newTxn.recipientId);
            finalFromAccount = investor ? `مستثمر: ${investor.name}` : 'مستثمر';
            finalRecipientType = 'Investor';
            finalProjectId = 'N/A';
            
            // SYNC LEDGER: Capital Injection - ONLY ON CREATE
            if (onUpdateInvestorTransactions && !isEditMode) {
                const invTxn: InvestorTransaction = {
                    id: `it-auto-${Date.now()}`,
                    investorId: newTxn.recipientId!,
                    type: 'Capital_Injection',
                    amount: newTxn.amount || 0,
                    date: newTxn.date || '',
                    notes: `إيداع نقدي (سند قبض #${finalSerial}) - ${newTxn.description}`
                };
                onUpdateInvestorTransactions([invTxn, ...investorTransactions]);
            }

        } else if (receiptSourceType === 'trustee') {
            const trustee = trustees.find(t => t.id === newTxn.recipientId);
            finalFromAccount = trustee ? `أمانة: ${trustee.name}` : 'أمانة';
            finalRecipientType = 'Trustee';
            finalProjectId = 'N/A';

            // SYNC LEDGER: Deposit - ONLY ON CREATE
            if (onUpdateTrustTransactions && !isEditMode) {
                const trTxn: TrustTransaction = {
                    id: `tt-auto-${Date.now()}`,
                    trusteeId: newTxn.recipientId!,
                    type: 'Deposit',
                    amount: newTxn.amount || 0,
                    date: newTxn.date || '',
                    notes: `إيداع نقدي (سند قبض #${finalSerial}) - ${newTxn.description}`
                };
                onUpdateTrustTransactions([trTxn, ...trustTransactions]);
            }

        } else {
            finalFromAccount = newTxn.fromAccount || 'جهة خارجية';
            finalRecipientType = 'Other';
        }
    } 
    // 2. Handle Payments (Expenses) - NEW LOGIC
    else if (newTxn.type === TransactionType.PAYMENT) {
        finalFromAccount = 'الخزينة الرئيسية'; 

        if (expenseContext === 'project') {
            finalProjectId = newTxn.projectId;
            
            // Source Logic
            if (paymentSource === 'main_treasury') {
                // Direct Cash Payment
                finalFromAccount = 'الخزينة الرئيسية';
                finalStatus = 'Completed'; 
            } else {
                // Pending Settlement (Recorded on Project, Not Paid from Treasury yet)
                finalFromAccount = 'صندوق الورشة (معلق)';
                finalStatus = 'Pending_Settlement'; 
                finalActualDate = ''; // No actual payment date yet
            }

            // Recipient Logic
            if (recipientMode === 'registered' && newTxn.recipientId) {
                const emp = employees.find(e => e.id === newTxn.recipientId);
                if (emp) {
                    finalRecipientName = emp.name;
                    finalRecipientType = emp.type === EmployeeType.CRAFTSMAN ? 'Craftsman' : 'Worker';
                }
            } else {
                finalRecipientType = 'Supplier';
            }

        } else if (expenseContext === 'investor') {
            finalProjectId = 'N/A';
            const investor = investors.find(inv => inv.id === newTxn.recipientId);
            finalRecipientName = investor ? `حساب المستثمر: ${investor.name}` : 'حساب مستثمر';
            finalRecipientType = 'Investor';
            finalStatus = 'Completed';

            // SYNC LEDGER: Withdrawal - ONLY ON CREATE
            if (onUpdateInvestorTransactions && !isEditMode) {
                const invTxn: InvestorTransaction = {
                    id: `it-auto-${Date.now()}`,
                    investorId: newTxn.recipientId!,
                    type: 'Withdrawal',
                    amount: newTxn.amount || 0,
                    date: newTxn.date || '',
                    notes: `سحب نقدي (سند صرف #${finalSerial}) - ${newTxn.description}`
                };
                onUpdateInvestorTransactions([invTxn, ...investorTransactions]);
            }

        } else if (expenseContext === 'trust') {
            finalProjectId = 'N/A';
            const trustee = trustees.find(t => t.id === newTxn.recipientId);
            finalRecipientName = trustee ? `أمانات: ${trustee.name}` : 'حساب أمانات';
            finalRecipientType = 'Trustee';
            finalStatus = 'Completed';

            // SYNC LEDGER: Withdrawal - ONLY ON CREATE
            if (onUpdateTrustTransactions && !isEditMode) {
                const trTxn: TrustTransaction = {
                    id: `tt-auto-${Date.now()}`,
                    trusteeId: newTxn.recipientId!,
                    type: 'Withdrawal',
                    amount: newTxn.amount || 0,
                    date: newTxn.date || '',
                    notes: `إرجاع مبلغ (سند صرف #${finalSerial}) - ${newTxn.description}`
                };
                onUpdateTrustTransactions([trTxn, ...trustTransactions]);
            }

        } else { // Company/General
            finalProjectId = 'General';
            finalRecipientName = 'مصاريف الشركة';
            finalRecipientType = 'Other';
            finalStatus = 'Completed';
        }
    }

    let finalDescription = newTxn.description || '';
    if (isAddingNewItem) {
        finalDescription = `${finalDescription} - (بند: ${newItemName})`;
    }

    // --- AUTO INVOICE LOGIC ---
    let linkedInvoiceId = undefined;
    if (newTxn.type === TransactionType.PAYMENT && createLinkedInvoice && onUpdateInvoices) {
        linkedInvoiceId = `inv-auto-${Date.now()}`;
        
        const newInvoice: Invoice = {
            id: linkedInvoiceId,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            date: newTxn.date || new Date().toISOString().split('T')[0],
            projectId: finalProjectId || 'General',
            supplierName: finalRecipientName || 'مورد عام',
            totalAmount: newTxn.amount || 0,
            amount: newTxn.amount || 0,
            subtotal: newTxn.amount || 0,
            discount: 0,
            status: 'Paid',
            type: InvoiceType.PURCHASE,
            category: 'مشتريات (تلقائي)',
            items: [{
                id: `item-${Date.now()}`,
                description: finalDescription,
                quantity: 1,
                unitPrice: newTxn.amount || 0,
                total: newTxn.amount || 0,
                unit: 'دفعة'
            }],
            isClientVisible: true, 
            customColumns: [],
            attachments: []
        };
        
        onUpdateInvoices([newInvoice, ...invoices]);
    }

    const transactionData: Transaction = {
        ...newTxn as Transaction,
        id: isEditMode && newTxn.id ? newTxn.id : `txn-${Date.now()}`,
        serialNumber: finalSerial,
        date: newTxn.date || new Date().toISOString().split('T')[0],
        description: finalDescription,
        fromAccount: finalFromAccount,
        toAccount: finalRecipientName || newTxn.toAccount || 'مصروفات',
        recipientName: finalRecipientName,
        recipientType: finalRecipientType as any,
        recipientId: finalRecipientId,
        projectId: finalProjectId,
        status: finalStatus,
        actualPaymentDate: finalActualDate, // Store the actual payment date
        hasLinkedInvoice: !!linkedInvoiceId || newTxn.hasLinkedInvoice,
        referenceId: linkedInvoiceId || newTxn.referenceId,
        statementItemId: selectedStatementItem 
    };

    if (isEditMode) {
        onUpdateTransactions(transactions.map(t => t.id === transactionData.id ? transactionData : t));
        if (onAction) onAction('UPDATE', 'Transaction', `تعديل القيد رقم ${finalSerial}`, transactionData.id);
    } else {
        onUpdateTransactions([transactionData, ...transactions]);
        if (onAction) onAction('CREATE', 'Transaction', `إضافة ${transactionData.type} رقم ${finalSerial}`, transactionData.id);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const openSettleModal = (txn: Transaction) => {
      setTxnToSettle(txn);
      setSettleDate(new Date().toISOString().split('T')[0]); // Default to today
      setIsSettleModalOpen(true);
  };

  const confirmSettlement = (e: React.FormEvent) => {
      e.preventDefault();
      if (!txnToSettle) return;

      onUpdateTransactions(transactions.map(t => {
          if (t.id === txnToSettle.id) {
              return { 
                  ...t, 
                  status: 'Completed', 
                  actualPaymentDate: settleDate, // Update with the selected date
                  fromAccount: 'الخزينة الرئيسية' // Now it officially leaves treasury
              };
          }
          return t;
      }));

      if (onAction) onAction('UPDATE', 'Transaction', `ترحيل القيد (صرف فعلي) بتاريخ ${settleDate}`, txnToSettle.id);
      
      setIsSettleModalOpen(false);
      setTxnToSettle(null);
  };

  const resetForm = () => {
    setNewTxn({ 
        serialNumber: undefined, amount: 0, currency: 'USD', description: '', 
        fromAccount: 'الخزينة الرئيسية', toAccount: '', type: TransactionType.PAYMENT,
        recipientType: 'Other', projectId: 'General', statementItemId: '', hasLinkedInvoice: false, recipientId: '',
        status: 'Completed'
    });
    setReceiptSourceType('client');
    setRecipientMode('external');
    setExpenseContext('project');
    setPaymentSource('main_treasury');
    setSelectedStatementItem('');
    setCreateLinkedInvoice(false);
    setIsEditMode(false);
    setIsAddingNewItem(false);
    setNewItemName('');
  }

  const handleOpenAddModal = () => {
    resetForm();
    let defaultType = TransactionType.PAYMENT;
    if (activeTab === 'revenues') defaultType = TransactionType.RECEIPT;
    if (activeTab === 'transfers') defaultType = TransactionType.TRANSFER;

    setNewTxn(prev => ({ ...prev, type: defaultType }));
    setIsModalOpen(true);
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description.includes(searchTerm) || txn.fromAccount.includes(searchTerm) || txn.toAccount.includes(searchTerm);
    const matchesYear = selectedYear ? txn.date.startsWith(selectedYear.toString()) : true;
    let matchesType = false;

    if (activeTab === 'pending') {
        return txn.status === 'Pending_Settlement' && matchesSearch;
    }

    if (activeTab === 'expenses') matchesType = txn.type === TransactionType.PAYMENT;
    else if (activeTab === 'revenues') matchesType = txn.type === TransactionType.RECEIPT;
    else if (activeTab === 'transfers') matchesType = txn.type === TransactionType.TRANSFER;

    return matchesType && matchesSearch && matchesYear;
  });

  const currentTotal = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحركات المالية $</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">سجل المدفوعات والمقبوضات (الخزينة والمشاريع)</p>
        </div>
      </div>

      {/* Tabs and layout omitted for brevity, using same as before... */}
      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto">
         <button onClick={() => setActiveTab('expenses')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}><TrendingDown size={18} /> المصاريف</button>
         <button onClick={() => setActiveTab('revenues')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'revenues' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}><TrendingUp size={18} /> الإيرادات</button>
         <button onClick={() => setActiveTab('transfers')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'transfers' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}><RefreshCcw size={18} /> التحويلات</button>
         <button onClick={() => setActiveTab('pending')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'pending' ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}><Clock size={18} /> معلقة (للترحيل)</button>
      </div>
      
      <div className={`p-6 rounded-2xl border flex items-center justify-between ${activeTab === 'expenses' ? 'bg-blue-50 border-blue-100 text-blue-800' : activeTab === 'revenues' ? 'bg-green-50 border-green-100 text-green-800' : activeTab === 'pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
          <div>
            <p className="text-sm font-bold opacity-80 mb-1">الإجمالي للفترة الحالية</p>
            <h2 className="text-4xl font-extrabold tracking-tight">{formatCurrency(currentTotal, 'USD')}</h2>
          </div>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800">
        <div className="relative w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="بحث..." className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={handleOpenAddModal} className={`text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow-lg font-bold transition-colors ${activeTab === 'expenses' ? 'bg-blue-600 hover:bg-blue-700' : activeTab === 'revenues' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
            <PlusCircle size={18} />
            <span>{activeTab === 'expenses' ? 'تسجيل مصروف' : activeTab === 'revenues' ? 'تسجيل إيراد' : 'تحويل جديد'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">رقم القيد</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">الوصف</th>
                <th className="px-6 py-4">الجهة / المشروع</th>
                <th className="px-6 py-4">من حساب</th>
                <th className="px-6 py-4">إلى حساب</th>
                <th className="px-6 py-4">المبلغ</th>
                {activeTab === 'pending' && <th className="px-6 py-4">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-700 dark:text-gray-300">#{txn.serialNumber}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      <div className="flex flex-col">
                          <span>{txn.date}</span>
                          {txn.actualPaymentDate && txn.actualPaymentDate !== txn.date && (
                              <span className="text-[10px] text-green-600 font-bold">صرف: {txn.actualPaymentDate}</span>
                          )}
                      </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-white truncate max-w-xs">{txn.description}</td>
                  <td className="px-6 py-4">
                      {txn.projectId && txn.projectId !== 'General' && txn.projectId !== 'N/A' ? 
                        <span className="bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 w-fit"><Briefcase size={10} /> {projects.find(p => p.id === txn.projectId)?.name}</span> : 
                        <span className="text-gray-400 text-xs">عام</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.fromAccount}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.toAccount}</td>
                  <td className={`px-6 py-4 font-bold ${txn.type === TransactionType.RECEIPT ? 'text-green-600' : 'text-blue-600'}`}>{formatCurrency(txn.amount)}</td>
                  {activeTab === 'pending' && (
                      <td className="px-6 py-4">
                          <button 
                            onClick={() => openSettleModal(txn)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                          >
                              <CheckSquare size={14} /> ترحيل (صرف)
                          </button>
                      </td>
                  )}
                </tr>
              ))}
              {filteredTransactions.length === 0 && <tr><td colSpan={activeTab === 'pending' ? 8 : 7} className="text-center py-10 text-gray-400">لا توجد حركات</td></tr>}
            </tbody>
        </table>
      </div>

      {/* Settle Modal (Tarheel) */}
      <Modal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} title="ترحيل الدفعة (صرف فعلي)">
          <form onSubmit={confirmSettlement} className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                      سيتم تحويل حالة الدفعة إلى "مكتملة" وخصم المبلغ فعلياً من الخزينة الرئيسية.
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                      يرجى تحديد تاريخ خروج الكاش الفعلي من الصندوق للمطابقة.
                  </p>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ الصرف الفعلي (خروج النقد)</label>
                  <input 
                      type="date" 
                      className="w-full px-4 py-3 border rounded-lg font-bold text-gray-800 dark:bg-dark-950 dark:text-white dark:border-dark-700"
                      value={settleDate}
                      onChange={(e) => setSettleDate(e.target.value)}
                      required
                  />
              </div>

              <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 shadow-lg">
                      تأكيد الصرف والترحيل
                  </button>
                  <button type="button" onClick={() => setIsSettleModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-200">
                      إلغاء
                  </button>
              </div>
          </form>
      </Modal>

      {/* Add Transaction Modal */}
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

          <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">تاريخ التسجيل</label>
              <input type="date" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" value={newTxn.date} onChange={(e) => setNewTxn({...newTxn, date: e.target.value})} required />
          </div>

          {/* ---------------- NEW PAYMENT CONTEXT LOGIC ---------------- */}
          {newTxn.type === TransactionType.PAYMENT && (
             <div className="space-y-4 border-t border-gray-100 dark:border-dark-700 pt-4">
                
                {/* 1. Context Selection */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">توجيه المصروف (على حساب من؟):</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { id: 'project', label: 'مشروع / ورشة', icon: Briefcase },
                            { id: 'investor', label: 'حساب مستثمر', icon: TrendingUp },
                            { id: 'trust', label: 'أمانات', icon: Shield },
                            { id: 'company', label: 'مصاريف الشركة', icon: Building2 },
                        ].map((ctx) => (
                            <button
                                type="button"
                                key={ctx.id}
                                onClick={() => {
                                    setExpenseContext(ctx.id as ExpenseContext);
                                    setNewTxn({...newTxn, recipientId: '', projectId: ctx.id === 'company' ? 'General' : ''});
                                }}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-bold border transition-all ${
                                    expenseContext === ctx.id 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                    : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-700 hover:bg-gray-50'
                                }`}
                            >
                                <ctx.icon size={18} />
                                {ctx.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Dynamic Fields based on Context */}
                <div className="bg-gray-50 dark:bg-dark-800/50 p-4 rounded-xl border border-gray-100 dark:border-dark-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                    
                    {/* A. PROJECT CONTEXT */}
                    {expenseContext === 'project' && (
                        <>
                            <SearchableSelect 
                                label="اختر المشروع" 
                                options={activeProjects.map(p => ({ value: p.id, label: p.name }))} 
                                value={newTxn.projectId || ''} 
                                onChange={(val) => setNewTxn({...newTxn, projectId: val})} 
                                required
                            />

                            {/* Source Selection for Projects - UPDATED LOGIC */}
                            <div className="p-3 bg-white dark:bg-dark-900 rounded-lg border border-blue-100 dark:border-dark-700">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">طريقة الدفع (مصدر الأموال):</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentSource('main_treasury')}
                                        className={`flex-1 py-3 px-3 text-xs font-bold rounded-md transition-all flex flex-col items-center justify-center gap-1 ${paymentSource === 'main_treasury' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-1"><Wallet size={14} /> دفع نقدي مباشر</div>
                                        <span className="text-[9px] opacity-80">(خروج كاش من الخزينة فوراً)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentSource('project_pending')}
                                        className={`flex-1 py-3 px-3 text-xs font-bold rounded-md transition-all flex flex-col items-center justify-center gap-1 ${paymentSource === 'project_pending' ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-1"><Clock size={14} /> تسجيل على المشروع (معلق)</div>
                                        <span className="text-[9px] opacity-80">(يظهر للعميل - يحتاج ترحيل لخروج الكاش)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Recipient */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium dark:text-gray-300">المستلم (الجهة / العامل)</label>
                                    <div className="flex bg-gray-200 dark:bg-dark-700 p-0.5 rounded text-[10px]">
                                        <button type="button" onClick={() => setRecipientMode('external')} className={`px-2 py-0.5 rounded ${recipientMode === 'external' ? 'bg-white text-black shadow' : 'text-gray-500'}`}>خارجي</button>
                                        <button type="button" onClick={() => setRecipientMode('registered')} className={`px-2 py-0.5 rounded ${recipientMode === 'registered' ? 'bg-white text-black shadow' : 'text-gray-500'}`}>مسجل</button>
                                    </div>
                                </div>
                                {recipientMode === 'external' ? (
                                    <input type="text" placeholder="اسم المورد / المحل" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" value={newTxn.toAccount} onChange={(e) => setNewTxn({...newTxn, toAccount: e.target.value})} />
                                ) : (
                                    <SearchableSelect 
                                        placeholder="اختر الحرفي..."
                                        options={craftsmenAndWorkers.map(e => ({ value: e.id, label: `${e.name} (${e.role})` }))}
                                        value={newTxn.recipientId || ''}
                                        onChange={(val) => {
                                            const selected = craftsmenAndWorkers.find(e => e.id === val);
                                            setNewTxn({...newTxn, recipientId: val, toAccount: selected?.name || ''});
                                        }}
                                    />
                                )}
                            </div>

                            {/* Link to Statement Item */}
                            <SearchableSelect 
                                label="ربط ببند الكشف (اختياري)"
                                placeholder="اختر البند..."
                                options={newTxn.projectId ? (projects.find(p => p.id === newTxn.projectId)?.statementRows?.map(r => ({ value: r.id, label: r['item'] || 'بند' })) || []) : []}
                                value={selectedStatementItem}
                                onChange={setSelectedStatementItem}
                            />

                            {/* Invoice Option */}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="createInv" className="w-4 h-4" checked={createLinkedInvoice} onChange={e => setCreateLinkedInvoice(e.target.checked)} />
                                <label htmlFor="createInv" className="text-sm font-bold text-gray-700 dark:text-gray-300">إنشاء فاتورة مشتريات لهذا المصروف</label>
                            </div>
                        </>
                    )}

                    {/* B. INVESTOR CONTEXT */}
                    {expenseContext === 'investor' && (
                        <div>
                            <SearchableSelect 
                                label="اختر المستثمر"
                                options={investors.map(inv => ({ value: inv.id, label: inv.name }))}
                                value={newTxn.recipientId || ''}
                                onChange={(val) => {
                                    const selected = investors.find(i => i.id === val);
                                    setNewTxn({...newTxn, recipientId: val, toAccount: selected?.name || ''});
                                }}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">سيتم خصم هذا المبلغ من رصيد المستثمر أو تسجيله كدفعة عليه.</p>
                        </div>
                    )}

                    {/* C. TRUST CONTEXT */}
                    {expenseContext === 'trust' && (
                        <div>
                            <SearchableSelect 
                                label="اختر صاحب الأمانة"
                                options={trustees.map(t => ({ value: t.id, label: t.name }))}
                                value={newTxn.recipientId || ''}
                                onChange={(val) => {
                                    const selected = trustees.find(t => t.id === val);
                                    setNewTxn({...newTxn, recipientId: val, toAccount: selected?.name || ''});
                                }}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">سيتم خصم المبلغ من رصيد الأمانة المحفوظ لدينا.</p>
                        </div>
                    )}

                    {/* D. COMPANY CONTEXT */}
                    {expenseContext === 'company' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">تصنيف المصروف</label>
                            <input 
                                type="text" 
                                placeholder="مثال: ضيافة، قرطاسية، إيجار..." 
                                className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white"
                                value={newTxn.toAccount}
                                onChange={(e) => setNewTxn({...newTxn, toAccount: e.target.value})}
                            />
                        </div>
                    )}
                </div>
             </div>
          )}

          {/* RECEIPT FORM LOGIC (Updated) */}
          {newTxn.type === TransactionType.RECEIPT && (
             <div className="space-y-3">
                 <div className="flex gap-2 overflow-x-auto pb-2">
                     {[
                         {id: 'client', label: 'دفعة عميل', icon: UserIcon}, 
                         {id: 'investor', label: 'رأس مال (مستثمر)', icon: TrendingUp}, 
                         {id: 'trustee', label: 'إيداع أمانة', icon: Shield}, 
                         {id: 'other', label: 'إيراد عام', icon: Plus}
                     ].map((type: any) => (
                         <button type="button" key={type.id} onClick={() => setReceiptSourceType(type.id)} className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-all whitespace-nowrap ${receiptSourceType === type.id ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                             <type.icon size={16} /> {type.label}
                         </button>
                     ))}
                 </div>
                 
                 {receiptSourceType === 'client' && <SearchableSelect label="المشروع" options={activeProjects.map(p => ({ value: p.id, label: p.name }))} value={newTxn.projectId || ''} onChange={(val) => setNewTxn({...newTxn, projectId: val})} />}
                 
                 {receiptSourceType === 'investor' && (
                     <SearchableSelect 
                        label="المستثمر (المصدر)" 
                        options={investors.map(i => ({ value: i.id, label: i.name }))} 
                        value={newTxn.recipientId || ''} 
                        onChange={(val) => setNewTxn({...newTxn, recipientId: val})} 
                        required
                     />
                 )}

                 {receiptSourceType === 'trustee' && (
                     <SearchableSelect 
                        label="صاحب الأمانة (المودع)" 
                        options={trustees.map(t => ({ value: t.id, label: t.name }))} 
                        value={newTxn.recipientId || ''} 
                        onChange={(val) => setNewTxn({...newTxn, recipientId: val})} 
                        required
                     />
                 )}

                 {receiptSourceType === 'other' && <input type="text" placeholder="اسم الجهة" className="w-full px-4 py-2 border rounded-lg" value={newTxn.fromAccount} onChange={(e) => setNewTxn({...newTxn, fromAccount: e.target.value})} />}
             </div>
          )}

          <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">البيان / التفاصيل</label><textarea rows={2} className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white resize-none" value={newTxn.description} onChange={(e) => setNewTxn({...newTxn, description: e.target.value})} /></div>

          <div className="pt-2 flex gap-3">
            <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700">حفظ</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;
