
import React, { useState } from 'react';
import { formatCurrency } from '../services/dataService';
import { Transaction, TransactionType, Project } from '../types';
import { Download, PlusCircle, ArrowUpRight, ArrowDownLeft, Search, Filter, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface TransactionsProps {
    transactions: Transaction[];
    onUpdateTransactions: (transactions: Transaction[]) => void;
    projects: Project[];
    selectedYear?: number;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onUpdateTransactions, projects, selectedYear }) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'revenues' | 'transfers' | 'pending'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTxn, setNewTxn] = useState<Partial<Transaction>>({
    amount: 0,
    currency: 'USD',
    description: '',
    fromAccount: 'الخزينة الرئيسية', 
    toAccount: '',
    type: TransactionType.PAYMENT,
    projectId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxn.amount || !newTxn.description) return;

    const txn: Transaction = {
      id: `txn-${Date.now()}`,
      type: newTxn.type as TransactionType,
      date: newTxn.date || new Date().toISOString().split('T')[0],
      amount: newTxn.amount || 0,
      currency: 'USD', // USD Only for this component
      description: newTxn.description || '',
      fromAccount: newTxn.fromAccount || 'الخزينة الرئيسية',
      toAccount: newTxn.toAccount || '',
      projectId: newTxn.projectId || 'General',
      status: 'Completed',
      serialNumber: Math.floor(Math.random() * 100000)
    };

    onUpdateTransactions([txn, ...transactions]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTxn({ 
        amount: 0, 
        currency: 'USD',
        description: '', 
        fromAccount: 'الخزينة الرئيسية', 
        toAccount: '', 
        type: TransactionType.PAYMENT,
        projectId: '',
        date: new Date().toISOString().split('T')[0]
    });
  }

  const handleOpenModal = () => {
    let defaultType = TransactionType.PAYMENT;
    if (activeTab === 'revenues') defaultType = TransactionType.RECEIPT;
    else if (activeTab === 'transfers') defaultType = TransactionType.TRANSFER;

    setNewTxn({ 
      amount: 0, 
      currency: 'USD',
      description: '', 
      fromAccount: 'الخزينة الرئيسية', 
      toAccount: '', 
      type: defaultType,
      projectId: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  // Filter Logic
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          txn.fromAccount.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          txn.toAccount.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear ? txn.date.startsWith(selectedYear.toString()) : true;
    
    // CRITICAL FIX: Filter out SYP transactions to prevent currency mixing
    const isUSD = txn.currency !== 'SYP';

    let matchesType = false;

    if (activeTab === 'pending') {
        return txn.status === 'Pending_Settlement' && matchesSearch;
    }

    if (activeTab === 'expenses') matchesType = txn.type === TransactionType.PAYMENT;
    else if (activeTab === 'revenues') matchesType = txn.type === TransactionType.RECEIPT;
    else if (activeTab === 'transfers') matchesType = txn.type === TransactionType.TRANSFER;

    return matchesType && matchesSearch && matchesYear && isUSD;
  });

  const currentTotal = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const projectOptions = projects.map(p => ({ value: p.id, label: p.name }));
  projectOptions.unshift({ value: 'General', label: 'عام / مصاريف تشغيلية' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحركات المالية ($)</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">سجل المدفوعات والمقبوضات بالدولار</p>
        </div>
        <div className="bg-white dark:bg-dark-900 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold block">الإجمالي للفترة الحالية</span>
            <span className={`text-xl font-bold ${activeTab === 'revenues' ? 'text-green-600' : 'text-blue-600'}`}>
                {formatCurrency(currentTotal)}
            </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto max-w-2xl">
         <button 
           onClick={() => setActiveTab('expenses')}
           className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <TrendingDown size={18} />
           المصاريف
         </button>
         <button 
           onClick={() => setActiveTab('revenues')}
           className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'revenues' ? 'bg-green-50 text-green-600 shadow-sm border border-green-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <TrendingUp size={18} />
           الإيرادات
         </button>
         <button 
           onClick={() => setActiveTab('transfers')}
           className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'transfers' ? 'bg-purple-50 text-purple-600 shadow-sm border border-purple-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <RefreshCw size={18} />
           التحويلات
         </button>
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
                onClick={handleOpenModal}
                className={`text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-bold ${
                    activeTab === 'expenses' ? 'bg-blue-600 hover:bg-blue-700' : 
                    activeTab === 'revenues' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
                <PlusCircle size={18} />
                <span>
                    {activeTab === 'expenses' ? 'تسجيل مصروف' : 
                     activeTab === 'revenues' ? 'تسجيل إيراد' : 'تسجيل تحويل'}
                </span>
            </button>
            <button className="bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-dark-700">
                <Filter size={18} />
                <span className="hidden md:inline">تصفية</span>
            </button>
            <button className="bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-dark-700">
                <Download size={18} />
                <span className="hidden md:inline">تصدير</span>
            </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">الوصف</th>
                <th className="px-6 py-4 font-medium">المشروع</th>
                <th className="px-6 py-4 font-medium">من حساب</th>
                <th className="px-6 py-4 font-medium">إلى حساب</th>
                <th className="px-6 py-4 font-medium">المبلغ ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        txn.type === TransactionType.RECEIPT ? 'bg-green-100 text-green-600' : 
                        txn.type === TransactionType.TRANSFER ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {txn.type === TransactionType.RECEIPT ? <ArrowDownLeft size={16} /> : 
                         txn.type === TransactionType.TRANSFER ? <RefreshCw size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                          {txn.type === TransactionType.RECEIPT ? 'سند قبض' : 
                           txn.type === TransactionType.TRANSFER ? 'تحويل داخلي' : 'سند صرف'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{txn.date}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                    {txn.description}
                    {txn.serialNumber && <span className="block text-[10px] text-gray-400 font-mono">#{txn.serialNumber}</span>}
                  </td>
                  <td className="px-6 py-4">
                      {txn.projectId && txn.projectId !== 'General' ? (
                          <span className="bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded text-xs">
                              {projects.find(p => p.id === txn.projectId)?.name || 'مشروع'}
                          </span>
                      ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.fromAccount}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.toAccount}</td>
                  <td className={`px-6 py-4 font-bold ${
                    txn.type === TransactionType.RECEIPT ? 'text-green-600' : 
                    txn.type === TransactionType.TRANSFER ? 'text-purple-600' : 'text-blue-600'
                  }`}>
                    {formatCurrency(txn.amount)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                  <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400 dark:text-gray-600">
                          لا توجد حركات مسجلة
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* New Transaction Modal */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`تسجيل ${activeTab === 'revenues' ? 'إيراد جديد' : activeTab === 'transfers' ? 'تحويل داخلي' : 'مصروف جديد'}`}>
        <form onSubmit={handleAddTransaction} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الحركة</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg dark:bg-dark-950 dark:text-white"
                  value={newTxn.date}
                  onChange={(e) => setNewTxn({...newTxn, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ ($)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:text-white font-bold"
                  value={newTxn.amount}
                  onChange={(e) => setNewTxn({...newTxn, amount: Number(e.target.value)})}
                />
              </div>
          </div>

          <div>
              <SearchableSelect 
                  label="المشروع المرتبط (اختياري)"
                  options={projectOptions}
                  value={newTxn.projectId || ''}
                  onChange={(val) => setNewTxn({...newTxn, projectId: val})}
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من حساب</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:text-white"
                  value={newTxn.fromAccount}
                  onChange={(e) => setNewTxn({...newTxn, fromAccount: e.target.value})}
                  placeholder="مثال: الخزينة الرئيسية"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى حساب</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:text-white"
                  value={newTxn.toAccount}
                  onChange={(e) => setNewTxn({...newTxn, toAccount: e.target.value})}
                  placeholder="مثال: اسم المستلم / مورد"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف / البيان</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none dark:bg-dark-800 dark:text-white"
              value={newTxn.description}
              onChange={(e) => setNewTxn({...newTxn, description: e.target.value})}
              placeholder="شرح تفاصيل الحركة..."
            />
          </div>
          
          <div className="pt-2 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              حفظ
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
    </div>
  );
};

export default Transactions;
